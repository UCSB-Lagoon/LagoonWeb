import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import {
  DailySeries, UsageHeatmap, RetentionGrid, PeopleTable,
  type DailyPoint, type HeatCell, type RetentionRow, type UserRow,
} from "@/components/admin/analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Analytics · Lagoon admin" };

// Who uses Lagoon, when, and for what. Everything on this page comes from one
// RPC, `admin_analytics_dashboard(p_days)` (iOS repo, Supabase migration 084),
// which only the service role can call. The Monday Discord report reads the
// same SQL, so the two never disagree. Internal accounts
// (`analytics_internal_users`) are excluded from every number.

type Dashboard = {
  generated_at: string;
  days: number;
  kpis: {
    dau: number; dau_yesterday: number; wau: number; wau_prev: number; mau: number;
    events_7d: number; total_users: number; signups_today: number; signups_7d: number;
    signups_prev_7d: number; sessions_7d: number; median_session_seconds: number | null;
    internal_excluded: number;
  };
  daily: DailyPoint[];
  heatmap: HeatCell[];
  funnel: {
    week: string; signups: number; onboarding: number; import_started: number; added_classes: number;
    four_plus: number; day1: number; week1: number; active_7d: number;
  }[];
  retention: RetentionRow[];
  features: { feature: string; users_7d: number; users_prev_7d: number; events_7d: number }[];
  tabs: { tab: string; users_7d: number; views_7d: number }[];
  launches: { foregrounds_7d: number; sources: { source: string; detail: string | null; opens: number; users: number }[] };
  imports: { version: string; method: string; started: number; succeeded: number; failed: number; reasons: Record<string, number> }[];
  versions: { version: string; users: number }[];
  users: UserRow[];
  diagnostics: {
    by_kind: { kind: string; version: string | null; reports: number; users: number }[];
    top_signatures: { kind: string; signature: string | null; reports: number; last_seen: string }[];
  };
  sharing: {
    shares: { event: string; kind: string | null; shares: number; users: number }[];
    link_clicks_web: number;
    link_opens_in_app: number;
    clicks_by_kind: { kind: string; clicks: number }[];
    probable_referrals: { sharer: string; joined: string; joined_at: string }[];
  };
};

const RANGES = [7, 30, 90] as const;

/// "1.19.0 (29)" sorts after "1.9.0 (15)" — string order gets this backwards.
function versionKey(v: string | null): number[] {
  const m = (v ?? "").match(/(\d+)\.(\d+)(?:\.(\d+))?(?:\s*\((\d+)\))?/);
  return m ? [1, 2, 3, 4].map((i) => Number(m[i] ?? 0)) : [0, 0, 0, 0];
}
function compareVersionsDesc(a: string | null, b: string | null): number {
  const ka = versionKey(a), kb = versionKey(b);
  for (let i = 0; i < 4; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
  return 0;
}

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "—";
}

function change(now: number, prev: number): { text: string; up: boolean | null } {
  if (prev === 0) return { text: now > 0 ? "new" : "—", up: null };
  const diff = Math.round(((now - prev) / prev) * 100);
  return { text: `${diff > 0 ? "+" : ""}${diff}% vs prior 7d`, up: diff === 0 ? null : diff > 0 };
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin/analytics");
  if (!isAdminEmail(user.email)) redirect("/admin");

  const { days: rawDays } = await searchParams;
  const days = RANGES.includes(Number(rawDays) as (typeof RANGES)[number]) ? Number(rawDays) : 30;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_analytics_dashboard" as never, { p_days: days } as never);
  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24">
        <h1 className="font-display text-3xl font-bold text-ink-900">Analytics unavailable</h1>
        <p className="mt-3 text-ink-500 font-mono text-sm">{error?.message ?? "No data returned."}</p>
      </div>
    );
  }
  const d = data as unknown as Dashboard;
  const k = d.kpis;
  const wauChange = change(k.wau, k.wau_prev);
  const signupChange = change(k.signups_7d, k.signups_prev_7d);
  const imports = [...d.imports].sort((a, b) => compareVersionsDesc(a.version, b.version) || b.started - a.started);
  const versions = [...d.versions].sort((a, b) => compareVersionsDesc(a.version, b.version));
  const organic = Math.max(0, d.launches.foregrounds_7d - d.launches.sources.reduce((s, x) => s + x.opens, 0));
  const fullCohorts = d.funnel.filter((f) => f.signups > 0);

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 mb-3">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-gold-700" /> Analytics
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Pacific time · updated {new Date(d.generated_at).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })}
            {k.internal_excluded > 0 && <> · {k.internal_excluded} internal account{k.internal_excluded === 1 ? "" : "s"} excluded</>}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--chart-grid)] p-1" role="tablist" aria-label="Range">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin/analytics?days=${r}`} role="tab" aria-selected={r === days}
                  className={`px-3 py-1 rounded-full text-sm ${r === days ? "bg-gold-500 text-on-accent font-semibold" : "text-ink-500 hover:text-ink-900"}`}>
              {r}d
            </Link>
          ))}
        </div>
      </div>

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Active today" value={k.dau} hint={`${k.dau_yesterday} yesterday`} />
        <Kpi label="Active · 7 days" value={k.wau} hint={wauChange.text} up={wauChange.up} />
        <Kpi label="Active · 30 days" value={k.mau} hint={`of ${k.total_users} accounts`} />
        <Kpi label="Signups · 7 days" value={k.signups_7d} hint={signupChange.text} up={signupChange.up} />
        <Kpi label="Opens · 7 days" value={k.sessions_7d} hint={`${k.wau ? (k.sessions_7d / k.wau).toFixed(1) : "0"} per active person`} />
        <Kpi label="Typical visit" value={k.median_session_seconds != null ? `${k.median_session_seconds}s` : "—"} hint="median, first to last tap" />
        <Kpi label="Stickiness" value={pct(k.dau, k.mau)} hint="today ÷ 30-day active" />
        <Kpi label="Signups today" value={k.signups_today} hint="new accounts" />
      </section>

      <section className="grid lg:grid-cols-2 gap-3 mb-6">
        <Card title={`Active people per day · ${days}d`}>
          <DailySeries data={d.daily} field="active" label="Active people" />
        </Card>
        <Card title={`New signups per day · ${days}d`}>
          <DailySeries data={d.daily} field="signups" label="Signups" />
        </Card>
      </section>

      <Card title="When people use Lagoon" note="distinct people per weekday × hour, last 4 weeks" className="mb-6">
        <UsageHeatmap cells={d.heatmap} />
      </Card>

      {/* ── Funnel & retention ─────────────────────────────────────────── */}
      <Card title="Activation funnel by signup week" note="of each week's signups" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs text-ink-400">
              <tr>
                <th className="text-left font-medium py-2">Week of</th>
                <th className="text-right font-medium px-2">Signed up</th>
                <th className="text-right font-medium px-2">Started import</th>
                <th className="text-right font-medium px-2">Has classes</th>
                <th className="text-right font-medium px-2">4+ classes</th>
                <th className="text-right font-medium px-2">Back next day</th>
                <th className="text-right font-medium px-2">Back in week 2</th>
                <th className="text-right font-medium pl-2">Active last 7d</th>
              </tr>
            </thead>
            <tbody>
              {fullCohorts.map((f) => (
                <tr key={f.week} className="border-t border-[var(--chart-grid)]">
                  <td className="py-2 text-ink-700">{new Date(`${f.week}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="px-2 text-right font-semibold text-ink-900">{f.signups}</td>
                  <FunnelCell n={f.import_started} of={f.signups} />
                  <FunnelCell n={f.added_classes} of={f.signups} />
                  <FunnelCell n={f.four_plus} of={f.signups} target={60} />
                  <FunnelCell n={f.day1} of={f.signups} pending={reached(f.week, 8) === false} />
                  <FunnelCell n={f.week1} of={f.signups} pending={reached(f.week, 21) === false} />
                  <FunnelCell n={f.active_7d} of={f.signups} last />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-400">REDESIGN.md target: 60% of new users with 4+ classes on day one. &ldquo;Back in week 2&rdquo; is any open 7–14 days after signup.</p>
      </Card>

      <Card title="Retention by signup week" note="% of each cohort who opened Lagoon in week N after signing up" className="mb-6">
        <RetentionGrid rows={d.retention.filter((r) => r.size > 0)} />
      </Card>

      {/* ── What they do ───────────────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-3 mb-6">
        <Card title="What people use" note="distinct people · 7d vs prior 7d">
          <BarList rows={d.features.map((f) => ({ label: f.feature, value: f.users_7d, sub: `${f.users_prev_7d} prior · ${f.events_7d} events` }))} />
        </Card>
        <Card title="Why they opened it" note="last 7 days">
          <BarList rows={[
            { label: "Opened it themselves", value: organic, sub: "no notification, widget or link" },
            ...d.launches.sources.map((s) => ({
              label: sourceLabel(s.source), value: s.opens,
              sub: `${s.users} people${s.detail ? ` · ${s.detail}` : ""}`,
            })),
          ]} />
          <p className="mt-3 text-xs text-ink-400">Launch sources are recorded from build 1.20 on; older builds count as opened themselves.</p>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-3 mb-6">
        <Card title="Tabs" note="people · 7d">
          <BarList rows={d.tabs.map((t) => ({ label: t.tab, value: t.users_7d, sub: `${t.views_7d} views` }))} />
        </Card>
        <Card title="Builds in use" note="each person's latest build · 30d">
          <BarList rows={versions.map((v) => ({ label: v.version ?? "unknown", value: v.users, sub: "" }))} />
        </Card>
      </section>

      {/* ── Import health ──────────────────────────────────────────────── */}
      <Card title="Schedule import by build" note="last 30 days · attempts, not people" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs text-ink-400">
              <tr>
                <th className="text-left font-medium py-2">Build</th>
                <th className="text-left font-medium px-2">Method</th>
                <th className="text-right font-medium px-2">Tries</th>
                <th className="text-right font-medium px-2">Worked</th>
                <th className="text-right font-medium px-2">Failed</th>
                <th className="text-left font-medium pl-2">Why it failed</th>
              </tr>
            </thead>
            <tbody>
              {imports.filter((i) => i.started + i.failed > 0).map((i) => (
                <tr key={`${i.version}-${i.method}`} className="border-t border-[var(--chart-grid)]">
                  <td className="py-2 text-ink-700 whitespace-nowrap">{i.version}</td>
                  <td className="px-2 text-ink-700">{i.method ?? "—"}</td>
                  <td className="px-2 text-right">{i.started}</td>
                  <td className="px-2 text-right font-semibold text-ink-900">{pct(i.succeeded, i.started)}</td>
                  <td className="px-2 text-right text-ink-500">{i.failed}</td>
                  <td className="pl-2 text-xs text-ink-500">
                    {Object.entries(i.reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r.replaceAll("_", " ")} ${n}`).join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Growth loop ────────────────────────────────────────────────── */}
      <section className="grid lg:grid-cols-2 gap-3 mb-6">
        <Card title="Sharing" note="last 30 days">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Mini label="Shares sent" value={d.sharing.shares.reduce((s, x) => s + x.shares, 0)} />
            <Mini label="Link clicks (web)" value={d.sharing.link_clicks_web} />
            <Mini label="Opened in app" value={d.sharing.link_opens_in_app} />
          </div>
          <BarList rows={d.sharing.shares.map((s) => ({ label: s.kind ?? s.event, value: s.shares, sub: `${s.users} people` }))} />
          <p className="mt-3 text-xs text-ink-400">Shares are recorded server-side from build 1.20; before that only <span className="font-mono">schedule_shared</span> reached the database.</p>
        </Card>
        <Card title="Probable referrals" note="new user befriended someone who'd shared in the 2 weeks before they joined">
          {d.sharing.probable_referrals.length === 0 ? (
            <p className="text-sm text-ink-400 py-6 text-center">None yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--chart-grid)] text-sm">
              {d.sharing.probable_referrals.slice(0, 20).map((r, i) => (
                <li key={i} className="py-2 flex justify-between gap-3">
                  <span className="text-ink-900">{r.sharer} <span className="text-ink-400">→</span> {r.joined}</span>
                  <span className="text-ink-400 text-xs">{new Date(r.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ── Stability ──────────────────────────────────────────────────── */}
      <Card title="Crashes and hangs" note="MetricKit, every user · last 30 days" className="mb-6">
        {d.diagnostics.top_signatures.length === 0 ? (
          <p className="text-sm text-ink-400 py-6 text-center">No reports yet. iOS delivers them up to a day later, from build 1.20 on.</p>
        ) : (
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs text-ink-400">
              <tr>
                <th className="text-left font-medium py-2">Kind</th>
                <th className="text-left font-medium px-2">Signature</th>
                <th className="text-right font-medium px-2">Reports</th>
                <th className="text-right font-medium pl-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {d.diagnostics.top_signatures.map((s, i) => (
                <tr key={i} className="border-t border-[var(--chart-grid)]">
                  <td className="py-2 text-ink-700 capitalize">{s.kind}</td>
                  <td className="px-2 font-mono text-xs text-ink-700 break-all">{s.signature ?? "—"}</td>
                  <td className="px-2 text-right font-semibold text-ink-900">{s.reports}</td>
                  <td className="pl-2 text-right text-xs text-ink-400">{new Date(s.last_seen).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Who ────────────────────────────────────────────────────────── */}
      <Card title="Who uses Lagoon" note={`everyone active in the last ${days} days · usual time is their most common hour`}>
        <PeopleTable users={d.users} />
      </Card>
    </div>
  );
}

function sourceLabel(source: string): string {
  switch (source) {
    case "notification": return "Notification";
    case "widget": return "Home-screen widget";
    case "live_activity": return "Live Activity";
    case "share_link": return "Shared link";
    case "seat_watch": return "Seat-open push";
    case "link": return "Web link";
    case "url_scheme": return "Other app link";
    default: return source;
  }
}

function Card({ title, note, children, className = "" }: {
  title: string; note?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
        {note && <span className="text-xs text-ink-400">{note}</span>}
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, value, hint, up }: { label: string; value: number | string; hint: string; up?: boolean | null }) {
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400">{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight tabular-nums text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">
        {up === true && <span aria-label="up">▲ </span>}
        {up === false && <span aria-label="down">▼ </span>}
        {hint}
      </p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400">{label}</p>
      <p className="font-display text-2xl font-extrabold tabular-nums text-ink-900">{value}</p>
    </div>
  );
}

/// Whether everyone in a signup week has had `days` days since that week
/// began — i.e. the whole cohort has passed the window being measured. A
/// cohort that hasn't would show a misleading 0%.
function reached(weekStart: string, days: number): boolean {
  return Date.now() >= new Date(`${weekStart}T00:00:00-07:00`).getTime() + days * 86_400_000;
}

function FunnelCell({ n, of, target, last, pending }: {
  n: number; of: number; target?: number; last?: boolean; pending?: boolean;
}) {
  const share = of > 0 ? Math.round((n / of) * 100) : 0;
  const short = target !== undefined && share < target;
  if (pending) {
    return (
      <td className={`${last ? "pl-2" : "px-2"} text-right text-xs text-ink-400`} title="Not everyone in this week has reached this point yet">
        not yet
      </td>
    );
  }
  return (
    <td className={`${last ? "pl-2" : "px-2"} text-right`}>
      <span className="text-ink-900">{of > 0 ? `${share}%` : "—"}</span>
      <span className="ml-1.5 text-xs text-ink-400">{n}</span>
      {short && <span className="sr-only"> (below {target}% target)</span>}
    </td>
  );
}

/// Horizontal bars, labels and values in ink; one hue for the bar.
function BarList({ rows }: { rows: { label: string; value: number; sub: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-ink-400 py-6 text-center">Nothing yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink-900 truncate">{r.label}</span>
            <span className="tabular-nums font-semibold text-ink-900">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--chart-grid)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: "var(--chart-1)" }} />
          </div>
          {r.sub && <p className="mt-0.5 text-[11px] text-ink-400">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
