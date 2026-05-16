import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail, Instagram, ExternalLink, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { StatusButtons } from "./status-buttons";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Captain applications · Admin" };

type Application = {
  id: string;
  name: string;
  email: string;
  year: string | null;
  major: string | null;
  instagram: string | null;
  pitch: string;
  why: string | null;
  referral_code: string | null;
  status: "new" | "reviewing" | "accepted" | "rejected" | "withdrawn";
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  captain_code: string | null;
  accepted_email_sent_at: string | null;
};

const STATUSES = ["new", "reviewing", "accepted", "rejected", "withdrawn"] as const;
const STATUS_STYLES: Record<string, string> = {
  new:        "bg-orange-100 text-orange-700 border-orange-200",
  reviewing:  "bg-amber-100 text-amber-700 border-amber-200",
  accepted:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected:   "bg-rose-100 text-rose-700 border-rose-200",
  withdrawn:  "bg-stone-100 text-stone-600 border-stone-200",
};

export default async function AdminCaptainsPage(
  { searchParams }: { searchParams: Promise<{ status?: string }> }
) {
  // ─── Gate ────────────────────────────────────────────────────────────────
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect(`/login?next=/admin/captains`);
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

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const { status: statusFilter } = await searchParams;
  const filter = (STATUSES as readonly string[]).includes(statusFilter ?? "")
    ? (statusFilter as Application["status"])
    : null;

  const admin = createAdminClient();
  let query = admin
    .from("captain_applications")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);

  const { data, error } = await query;
  const rows = (data as Application[] | null) || [];

  // Quick aggregates
  const totals = STATUSES.reduce<Record<string, number>>((m, s) => { m[s] = 0; return m; }, {});
  for (const r of rows) totals[r.status] = (totals[r.status] || 0) + 1;

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="pill mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Admin
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
            Captain applications
          </h1>
          <p className="mt-2 text-ink-500">
            {rows.length} {filter ? `${filter} · ` : "shown · "}
            signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-400 mr-1">
            <Filter className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Status
          </span>
          <FilterChip href="/admin/captains" label="All" active={!filter} />
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={`/admin/captains?status=${s}`}
              label={`${s} · ${totals[s] || 0}`}
              active={filter === s}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-500">
            No applications {filter ? `with status "${filter}"` : "yet"}.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => (
            <li key={a.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-bold text-lg text-ink-900">{a.name}</h2>
                    <span className={[
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                      STATUS_STYLES[a.status],
                    ].join(" ")}>{a.status}</span>
                    {a.referral_code && (
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-cream-100 text-ink-700 border-cream-200">
                        ref: {a.referral_code}
                      </span>
                    )}
                    {a.captain_code && (
                      <a
                        href={`https://app.lagoonucsb.com/r/${a.captain_code}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Captain link · /r/${a.captain_code}`}
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-orange-500 text-white border-orange-500 hover:bg-orange-600 transition"
                      >
                        /r/{a.captain_code}
                      </a>
                    )}
                    {a.status === "accepted" && a.accepted_email_sent_at && (
                      <span title={`Acceptance email sent ${new Date(a.accepted_email_sent_at).toLocaleString()}`}
                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                        ✓ emailed
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                    <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1.5 hover:text-orange-600">
                      <Mail className="w-3.5 h-3.5" /> {a.email}
                    </a>
                    {a.instagram && (
                      <a
                        href={`https://instagram.com/${a.instagram.replace(/^@/, "")}`}
                        rel="noreferrer"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 hover:text-orange-600"
                      >
                        <Instagram className="w-3.5 h-3.5" /> {a.instagram}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}
                    <span className="font-mono text-xs text-ink-400">
                      {new Date(a.submitted_at).toLocaleString()}
                    </span>
                    {a.year && a.major && (
                      <span>{a.year} · {a.major}</span>
                    )}
                  </div>
                </div>
                <StatusButtons id={a.id} current={a.status} captainCode={a.captain_code} emailedAt={a.accepted_email_sent_at} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <Block label="Network">{a.pitch}</Block>
                {a.why && <Block label="Why">{a.why}</Block>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
        active
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-white text-ink-700 border-cream-200 hover:bg-cream-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-400 mb-1">{label}</p>
      <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{children}</p>
    </div>
  );
}
