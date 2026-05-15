import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Inbox, Trophy, Users, Activity, BarChart3, ExternalLink,
  ArrowUpRight, Sparkles, Flame, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { CaptainFunnelChart } from "@/components/admin/funnel-chart";
import { InstallsChart } from "@/components/admin/installs-chart";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Admin · Lagoon" };

export default async function AdminHomePage() {
  // ── Auth gate ─────────────────────────────────────────────────────────
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">Not authorized</h1>
        <p className="mt-3 text-ink-500">
          Your account ({user.email}) isn&apos;t on the Lagoon admin list.
        </p>
        <Link href="/" className="btn-secondary mt-6 inline-flex">Back home</Link>
      </div>
    );
  }

  // ── Pull operational counts (best-effort) ─────────────────────────────
  const admin = createAdminClient();
  type StatusRow = { status: string };
  type RecentRow = {
    id: string; name: string; email: string;
    status: string; referral_code: string | null; submitted_at: string;
  };

  async function getStatusBreakdown(): Promise<Record<string, number>> {
    try {
      const res = await admin.from("captain_applications").select("status");
      const rows = (res.data as StatusRow[] | null) || [];
      const out: Record<string, number> = {};
      for (const r of rows) out[r.status] = (out[r.status] || 0) + 1;
      return out;
    } catch { return {}; }
  }
  async function safeCount(filter?: { kind: "withRef" }): Promise<number> {
    try {
      const q = admin.from("captain_applications").select("id", { count: "exact", head: true });
      const res = filter?.kind === "withRef"
        ? await q.not("referral_code", "is", null)
        : await q;
      return res.count ?? 0;
    } catch { return 0; }
  }
  async function getRecent(): Promise<RecentRow[]> {
    try {
      const res = await admin
        .from("captain_applications")
        .select("id, name, email, status, referral_code, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(5);
      return (res.data as RecentRow[] | null) || [];
    } catch { return []; }
  }
  async function getTopReferrals(): Promise<Array<[string, number]>> {
    try {
      const res = await admin
        .from("captain_applications")
        .select("referral_code")
        .not("referral_code", "is", null);
      const counts: Record<string, number> = {};
      for (const row of (res.data as { referral_code: string | null }[] | null) || []) {
        if (row.referral_code) counts[row.referral_code] = (counts[row.referral_code] || 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    } catch { return []; }
  }

  async function safeClickCount(): Promise<number> {
    try {
      const res = await admin
        .from("referral_clicks")
        .select("id", { count: "exact", head: true })
        .eq("is_bot", false);
      return res.count ?? 0;
    } catch { return 0; }
  }

  async function getDailyClicks(): Promise<Array<{ day: string; count: number }>> {
    try {
      // Last 14 days, humans only
      const since = new Date();
      since.setUTCHours(0, 0, 0, 0);
      since.setUTCDate(since.getUTCDate() - 13);
      const res = await admin
        .from("referral_clicks")
        .select("clicked_at")
        .eq("is_bot", false)
        .gte("clicked_at", since.toISOString())
        .order("clicked_at", { ascending: true });
      const rows = (res.data as { clicked_at: string }[] | null) || [];

      // Bucket into 14 day slots so the chart always shows the full window
      const buckets: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(since);
        d.setUTCDate(since.getUTCDate() + i);
        buckets[ymd(d)] = 0;
      }
      for (const r of rows) {
        const key = ymd(new Date(r.clicked_at));
        if (key in buckets) buckets[key]++;
      }
      return Object.entries(buckets).map(([day, count]) => ({ day, count }));
    } catch { return []; }
  }

  const [statusBreakdown, totalApps, withRef, recentApps, topReferrals, totalClicks, dailyClicks] = await Promise.all([
    getStatusBreakdown(),
    safeCount(),
    safeCount({ kind: "withRef" }),
    getRecent(),
    getTopReferrals(),
    safeClickCount(),
    getDailyClicks(),
  ]);

  const newCount = statusBreakdown.new || 0;
  const acceptedCount = statusBreakdown.accepted || 0;
  const reviewingCount = statusBreakdown.reviewing || 0;
  const refRate = totalApps > 0 ? Math.round((withRef / totalApps) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <span className="pill mb-3">
            <Shield className="w-3 h-3" />
            Admin
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
            Operations <span className="italic-accent">overview.</span>
          </h1>
          <p className="mt-2 text-ink-500">
            Signed in as <span className="font-mono">{user.email}</span>. Updated live.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/captains" className="btn-primary !py-2 !px-4 text-sm">
            <Inbox className="w-4 h-4" /> Captain inbox
          </Link>
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank" rel="noreferrer"
            className="btn-secondary !py-2 !px-4 text-sm"
          >
            <BarChart3 className="w-4 h-4 text-orange-500" /> GA4 <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Top stat row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Pending apps"
          value={newCount}
          icon={Inbox}
          hint="status = new"
          href="/admin/captains?status=new"
          hot={newCount > 0}
        />
        <StatCard
          label="In review"
          value={reviewingCount}
          icon={Activity}
          hint="opened, not decided"
          href="/admin/captains?status=reviewing"
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          icon={Sparkles}
          hint="active captains"
          href="/admin/captains?status=accepted"
        />
        <StatCard
          label="Referral attribution"
          value={`${refRate}%`}
          icon={Trophy}
          hint={`${withRef}/${totalApps} apps via /r/`}
          href="/admin/captains"
        />
      </section>

      {/* Charts row: funnel + installs */}
      <section className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-ink-900">Captain funnel</h2>
            <span className="text-xs text-ink-400">Last 30 days</span>
          </div>
          <CaptainFunnelChart
            stages={[
              { stage: "Referral clicks", value: totalClicks, hint: "humans only" },
              { stage: "Applications", value: statusBreakdown.new + (statusBreakdown.reviewing || 0) + (statusBreakdown.accepted || 0) + (statusBreakdown.rejected || 0), hint: "non-withdrawn" },
              { stage: "In review", value: (statusBreakdown.reviewing || 0) + (statusBreakdown.accepted || 0), hint: "opened" },
              { stage: "Accepted", value: statusBreakdown.accepted || 0, hint: "active captains" },
            ]}
          />
        </div>

        <div className="card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-ink-900">Referral clicks · 14d</h2>
            <span className="text-xs text-ink-400">humans only · /r/ landings</span>
          </div>
          <InstallsChart data={dailyClicks.map(d => ({ day: d.day.replaceAll("-", ""), count: d.count }))} totalLabel="from Lagoon" />
        </div>
      </section>

      {/* Two-column main */}
      <section className="grid lg:grid-cols-3 gap-4">
        {/* Recent applications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-ink-900">Recent applications</h2>
              <Link href="/admin/captains" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                All apps →
              </Link>
            </div>
            {recentApps.length === 0 ? (
              <p className="text-ink-500 text-sm py-6 text-center">
                No applications yet. Share a captain link to get the first one.
              </p>
            ) : (
              <ul className="divide-y divide-cream-200">
                {recentApps.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink-900 truncate">{a.name}</p>
                      <p className="text-xs text-ink-400 font-mono truncate">{a.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.referral_code && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-cream-100 text-ink-700 border border-cream-200">
                          ref: {a.referral_code}
                        </span>
                      )}
                      <StatusChip status={a.status} />
                      <span className="text-xs text-ink-400 font-mono hidden sm:inline">
                        {new Date(a.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink-900 mb-4">Quick links</h2>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              <QuickRow href="/admin/captains?status=new" icon={Inbox} title="Triage new apps" hint="status=new" />
              <QuickRow href="/stats" icon={Activity} title="Live stats" hint="public dashboard" />
              <QuickRow href="/leaderboard" icon={Trophy} title="Weekly leaderboard" hint="user XP race" />
              <QuickRow href="/" icon={Users} title="Front of house" hint="see what users see" />
              <QuickRow href="https://supabase.com/dashboard/project/qecthmyzcicllttplhjq" icon={ExternalLink} title="Supabase dashboard" hint="schema + auth" external />
              <QuickRow href="https://analytics.google.com/analytics/web/" icon={BarChart3} title="GA4 reports" hint="conversion + traffic" external />
            </ul>
          </div>
        </div>

        {/* Top referrers */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-ink-900">Top captains by apps driven</h2>
            </div>
            {topReferrals.length === 0 ? (
              <p className="text-ink-500 text-sm py-6 text-center">
                No referral attribution yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {topReferrals.map(([code, count], i) => (
                  <li key={code} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-cream-100/50 border border-cream-200">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={[
                        "font-mono text-xs font-bold w-5 text-center tabular-nums",
                        i === 0 ? "text-orange-600" : "text-ink-400",
                      ].join(" ")}>
                        {i + 1}
                      </span>
                      <span className="font-bold text-ink-900 truncate">{code}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 tabular-nums shrink-0">
                      <Flame className="w-3.5 h-3.5" />
                      {count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-4 text-xs text-ink-400">
              Counted by <span className="font-mono">referral_code</span> cookie at apply time.
            </p>
          </div>

          {/* Quick workflow card */}
          <div className="card-tinted p-5">
            <h3 className="font-display font-bold text-ink-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" /> How accept works
            </h3>
            <ol className="mt-3 text-sm text-ink-700 space-y-2 list-decimal pl-5">
              <li>Click <strong>Accept</strong> on a row in the inbox.</li>
              <li>Your default mail app opens, fully composed with their /r/CODE link.</li>
              <li>Hit Send in your mail app.</li>
              <li>Back in the inbox, click <strong>✓ Mark sent</strong>.</li>
            </ol>
            <p className="mt-3 text-xs text-ink-500">
              No setup needed. To auto-send (skip steps 2-4), add a <span className="font-mono">RESEND_API_KEY</span> env var later.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ymd(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

function StatCard({
  label, value, icon: Icon, hint, href, hot,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  href: string;
  hot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "card p-4 group flex flex-col gap-1.5",
        hot ? "ring-2 ring-orange-400/30" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400">{label}</p>
        <Icon className={`w-4 h-4 ${hot ? "text-orange-500" : "text-ink-300"} group-hover:text-orange-500 transition`} />
      </div>
      <p className={[
        "font-display text-3xl font-extrabold tracking-tight tabular-nums",
        hot ? "text-orange-600" : "text-ink-900",
      ].join(" ")}>{value}</p>
      <p className="text-xs text-ink-400">{hint}</p>
    </Link>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    new:        "bg-orange-100 text-orange-700 border-orange-200",
    reviewing:  "bg-amber-100 text-amber-700 border-amber-200",
    accepted:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected:   "bg-rose-100 text-rose-700 border-rose-200",
    withdrawn:  "bg-stone-100 text-stone-600 border-stone-200",
  };
  return (
    <span className={[
      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
      map[status] || map.new,
    ].join(" ")}>{status}</span>
  );
}

function QuickRow({
  href, icon: Icon, title, hint, external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  external?: boolean;
}) {
  const Tag = external ? "a" : (Link as unknown as "a");
  return (
    <li>
      <Tag
        href={href}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cream-200 hover:border-orange-300 hover:bg-cream-100/50 transition group"
      >
        <Icon className="w-4 h-4 text-orange-500" />
        <span className="flex-1 min-w-0">
          <span className="font-bold text-ink-900 block">{title}</span>
          <span className="text-xs text-ink-400">{hint}</span>
        </span>
        {external ? (
          <ExternalLink className="w-3.5 h-3.5 text-ink-300 group-hover:text-ink-500" />
        ) : (
          <ArrowUpRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-orange-500" />
        )}
      </Tag>
    </li>
  );
}
