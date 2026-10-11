import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, ShieldOff, EyeOff, Eye, CheckCheck, Instagram } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { RpcActionButton } from "@/components/admin/rpc-action-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Chapters · Admin" };

type Claim = {
  org_id: string; org_slug: string; org_name: string; org_letters: string | null;
  org_council: string | null; org_status: string;
  user_id: string; display_name: string; full_name: string | null; class_level: string | null; email: string | null;
  position: string; note: string | null; requested_at: string; approved_officers: number;
};
type Officer = {
  org_id: string; org_name: string; org_letters: string | null;
  user_id: string; display_name: string; email: string | null; position: string; reviewed_at: string | null;
};
type Report = {
  id: string; org_id: string; org_name: string; org_status: string;
  reason: string; note: string | null; created_at: string; reporter_email: string | null;
};
type Raised = {
  id: string; org_name: string; org_letters: string | null; amount_cents: number; note: string;
  proof_url: string | null; raised_on: string; created_at: string; reported_by: string | null;
};
type Queue = { claims: Claim[]; officers: Officer[]; reports: Report[] };

/**
 * Officer claims for chapter pages (migration 089). Verify each claim out of
 * band before approving — the chapter's Instagram, the council, or the
 * officer list SEAL publishes. An approved officer can edit the page and
 * post events (which still go through /admin/events).
 */
export default async function AdminOrgsPage() {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin/orgs");
  if (!isAdminEmail(user.email)) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink-900">Not authorized</h1>
        <p className="mt-3 text-ink-500">Your account ({user.email}) isn&apos;t on the Lagoon admin list.</p>
        <Link href="/" className="btn-secondary mt-6 inline-flex">Back home</Link>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("admin_org_queue" as never);
  const queue = (data as Queue | null) ?? { claims: [], officers: [], reports: [] };
  const { data: raisedData } = await admin.rpc("admin_org_raised_queue" as never);
  const raised = (raisedData as Raised[] | null) ?? [];
  const endpoint = "/api/admin/orgs";

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 space-y-10">
      <div>
        <span className="pill mb-3"><span className="w-1.5 h-1.5 rounded-full bg-gold-500" />Admin</span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Chapters</h1>
        <p className="mt-2 text-ink-500">
          {queue.claims.length} claim{queue.claims.length === 1 ? "" : "s"} waiting · {queue.reports.length} open report
          {queue.reports.length === 1 ? "" : "s"} · <Link className="underline" href="/admin/events">Events queue</Link>
        </p>
      </div>

      {error && (
        <div className="card p-4 border-danger-200 bg-danger-50 text-danger-ink text-sm">
          {error.message} — has migration 089 been applied?
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Officer claims</h2>
        {queue.claims.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">No claims waiting.</div>
        ) : (
          <ul className="space-y-3">
            {queue.claims.map((c) => (
              <li key={`${c.org_id}-${c.user_id}`} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-ink-900">
                      {c.org_letters} {c.org_name}
                      <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                        {c.org_council} · {c.org_status} · {c.approved_officers}/4 officers
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-ink-700">
                      {c.full_name || c.display_name} · {c.class_level ?? "year unknown"} · <span className="font-mono">{c.email}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Position: <strong>{c.position}</strong> · {new Date(c.requested_at).toLocaleString()}
                    </p>
                    {c.note && <blockquote className="mt-2 text-sm text-ink-700 border-l-2 border-cream-200 pl-3">{c.note}</blockquote>}
                    <a
                      href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(`ucsb ${c.org_name}`)}`}
                      target="_blank" rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-gold-700"
                    >
                      <Instagram className="w-3 h-3" /> Find the chapter&apos;s Instagram to verify
                    </a>
                  </div>
                  <div className="flex gap-1.5">
                    <RpcActionButton endpoint={endpoint} tone="good" icon={Check} label="Approve"
                      body={{ action: "officer", org_id: c.org_id, user_id: c.user_id, status: "approved" }} />
                    <RpcActionButton endpoint={endpoint} tone="bad" icon={X} label="Reject"
                      body={{ action: "officer", org_id: c.org_id, user_id: c.user_id, status: "rejected" }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Reports on chapter pages</h2>
        {queue.reports.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">No open reports.</div>
        ) : (
          <ul className="space-y-3">
            {queue.reports.map((r) => (
              <li key={r.id} className="card p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-ink-900">{r.org_name} <span className="text-xs text-ink-400">({r.org_status})</span></h3>
                  <p className="text-sm text-ink-700"><strong>{r.reason}</strong>{r.note ? ` — ${r.note}` : ""}</p>
                  <p className="text-xs text-ink-400 font-mono">{r.reporter_email} · {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1.5">
                  {r.org_status !== "hidden" ? (
                    <RpcActionButton endpoint={endpoint} tone="bad" icon={EyeOff} label="Hide page"
                      confirm={`Hide ${r.org_name} everywhere in Lagoon?`}
                      body={{ action: "org_status", org_id: r.org_id, status: "hidden" }} />
                  ) : (
                    <RpcActionButton endpoint={endpoint} icon={Eye} label="Unhide"
                      body={{ action: "org_status", org_id: r.org_id, status: "unclaimed" }} />
                  )}
                  <RpcActionButton endpoint={endpoint} icon={CheckCheck} label="Resolve"
                    body={{ action: "resolve_report", report_id: r.id }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-1">Money raised to verify</h2>
        <p className="text-sm text-ink-500 mb-3">
          Officers report philanthropy totals for the Chapter Cup. Check the proof link (or the chapter&apos;s
          fundraiser page) before verifying: only verified amounts count.
        </p>
        {raised.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">Nothing waiting.</div>
        ) : (
          <ul className="space-y-3">
            {raised.map((r) => (
              <li key={r.id} className="card p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{r.org_letters} {r.org_name}</p>
                  <h3 className="font-display font-bold text-lg text-ink-900">
                    {(r.amount_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </h3>
                  <p className="text-sm text-ink-700">{r.note} · raised {r.raised_on} · by {r.reported_by ?? "?"}</p>
                  {r.proof_url ? (
                    <a className="text-sm underline" href={r.proof_url} target="_blank" rel="noreferrer">Proof</a>
                  ) : (
                    <p className="text-sm text-ink-400">No proof link</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <RpcActionButton endpoint={endpoint} tone="good" icon={Check} label="Verify"
                    body={{ action: "raised", report_id: r.id, verify: true }} />
                  <RpcActionButton endpoint={endpoint} tone="bad" icon={X} label="Don't count"
                    confirm="Leave this amount out of the Cup?"
                    body={{ action: "raised", report_id: r.id, verify: false }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Approved officers</h2>
        {queue.officers.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">None yet.</div>
        ) : (
          <ul className="card divide-y divide-cream-200">
            {queue.officers.map((o) => (
              <li key={`${o.org_id}-${o.user_id}`} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-ink-700">
                  <strong>{o.org_letters} {o.org_name}</strong> · {o.display_name} · {o.position} · <span className="font-mono text-xs">{o.email}</span>
                </span>
                <RpcActionButton endpoint={endpoint} tone="bad" icon={ShieldOff} label="Revoke"
                  confirm={`Revoke ${o.display_name}'s officer access to ${o.org_name}?`}
                  body={{ action: "officer", org_id: o.org_id, user_id: o.user_id, status: "revoked" }} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
