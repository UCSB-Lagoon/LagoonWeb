import { redirect } from "next/navigation";
import Link from "next/link";
import { Filter, Mail, Bug, Lightbulb, Heart, HelpCircle, MessageSquare, Pin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { FeedbackActions } from "./feedback-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Feedback · Admin" };

type Row = {
  id: string;
  kind: "idea" | "bug" | "praise" | "question" | "other";
  message: string;
  email: string | null;
  page_path: string | null;
  status: "new" | "triaged" | "planned" | "shipped" | "declined";
  pinned: boolean;
  admin_notes: string | null;
  submitted_at: string;
};

const STATUSES = ["new", "triaged", "planned", "shipped", "declined"] as const;
const KIND_META: Record<string, { icon: typeof Bug; cls: string }> = {
  idea:     { icon: Lightbulb,   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  bug:      { icon: Bug,         cls: "bg-rose-100 text-rose-700 border-rose-200" },
  praise:   { icon: Heart,       cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  question: { icon: HelpCircle,  cls: "bg-sky-100 text-sky-700 border-sky-200" },
  other:    { icon: MessageSquare, cls: "bg-stone-100 text-stone-600 border-stone-200" },
};
const STATUS_CLS: Record<string, string> = {
  new:      "bg-orange-100 text-orange-700 border-orange-200",
  triaged:  "bg-amber-100 text-amber-700 border-amber-200",
  planned:  "bg-sky-100 text-sky-700 border-sky-200",
  shipped:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-stone-100 text-stone-600 border-stone-200",
};

export default async function AdminFeedbackPage(
  { searchParams }: { searchParams: Promise<{ status?: string; kind?: string }> }
) {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin/feedback");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">Not authorized</h1>
        <p className="mt-3 text-ink-500">{user.email} isn&apos;t on the admin list.</p>
        <Link href="/" className="btn-secondary mt-6 inline-flex">Home</Link>
      </div>
    );
  }

  const { status: sf, kind: kf } = await searchParams;
  const statusFilter = (STATUSES as readonly string[]).includes(sf ?? "") ? sf! : null;

  const admin = createAdminClient();
  let q = admin
    .from("feedback")
    .select("*")
    .order("pinned", { ascending: false })
    .order("submitted_at", { ascending: false })
    .limit(300);
  if (statusFilter) q = q.eq("status", statusFilter);
  if (kf) q = q.eq("kind", kf);

  const { data, error } = await q;
  const rows = (data as Row[] | null) || [];

  const totals = STATUSES.reduce<Record<string, number>>((m, s) => { m[s] = 0; return m; }, {});
  for (const r of rows) totals[r.status] = (totals[r.status] || 0) + 1;

  return (
    <div className="max-w-7xl mx-auto px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <span className="pill mb-3"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Admin</span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Feedback inbox</h1>
          <p className="mt-2 text-ink-500">{rows.length} shown · signed in as <span className="font-mono">{user.email}</span></p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-400 mr-1">
            <Filter className="w-3.5 h-3.5 inline -mt-0.5 mr-1" /> Status
          </span>
          <Chip href="/admin/feedback" label="All" active={!statusFilter} />
          {STATUSES.map((s) => (
            <Chip key={s} href={`/admin/feedback?status=${s}`} label={`${s} · ${totals[s] || 0}`} active={statusFilter === s} />
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 border-rose-200 bg-rose-50 text-rose-700 text-sm">{error.message}</div>
      )}

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">No feedback {statusFilter ? `with status "${statusFilter}"` : "yet"}.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((f) => {
            const km = KIND_META[f.kind] || KIND_META.other;
            const KIcon = km.icon;
            return (
              <li key={f.id} className={["card p-5", f.pinned ? "ring-2 ring-amber-300/50" : ""].join(" ")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {f.pinned && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${km.cls}`}>
                        <KIcon className="w-3 h-3" /> {f.kind}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${STATUS_CLS[f.status]}`}>
                        {f.status}
                      </span>
                      {f.page_path && (
                        <span className="text-[10px] font-mono text-ink-400 px-2 py-0.5 rounded-full bg-cream-100 border border-cream-200">
                          {f.page_path}
                        </span>
                      )}
                      <span className="text-xs text-ink-400 font-mono">{new Date(f.submitted_at).toLocaleString()}</span>
                    </div>
                    <p className="text-ink-900 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                    {f.email && (
                      <a href={`mailto:${f.email}?subject=Re:%20your%20Lagoon%20feedback`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700">
                        <Mail className="w-3.5 h-3.5" /> {f.email}
                      </a>
                    )}
                  </div>
                  <FeedbackActions id={f.id} status={f.status} pinned={f.pinned} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize",
        active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-ink-700 border-cream-200 hover:bg-cream-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
