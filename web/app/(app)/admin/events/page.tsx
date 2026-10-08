import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, EyeOff, Eye, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { RpcActionButton } from "@/components/admin/rpc-action-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "Events · Admin" };

type Pending = {
  id: string; title: string; description: string | null; category: string;
  starts_at: string; ends_at: string; venue_kind: string; venue_label: string; area_label: string | null;
  lat: number | null; lng: number | null; capacity: number | null; created_at: string; updated_at: string;
  org_name: string; org_letters: string | null; org_slug: string; posted_by: string; posted_by_email: string | null;
};
type Reported = {
  id: string; title: string; status: string; starts_at: string; venue_label: string;
  org_name: string; org_letters: string | null; reports: number; reasons: string[]; notes: string[]; last_report: string;
};
type Upcoming = { id: string; title: string; starts_at: string; venue_label: string; org_name: string; rsvps: number };
type Queue = { pending: Pending[]; reported: Reported[]; upcoming: Upcoming[] };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

/**
 * Hosted events (migration 090). Nothing is visible in the app until it's
 * approved here. Reject parties and anything with alcohol (the app has no
 * category for them, so they arrive as "other" or "recruitment"), anything
 * at a private house that isn't plausibly the chapter's, and anything vague.
 * A rejection reason is sent to the officer as-is.
 */
export default async function AdminEventsPage() {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect("/login?next=/admin/events");
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
  const { data, error } = await admin.rpc("admin_org_events_queue" as never);
  const queue = (data as Queue | null) ?? { pending: [], reported: [], upcoming: [] };
  const endpoint = "/api/admin/events";

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 space-y-10">
      <div>
        <span className="pill mb-3"><span className="w-1.5 h-1.5 rounded-full bg-gold-500" />Admin</span>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Hosted events</h1>
        <p className="mt-2 text-ink-500">
          {queue.pending.length} waiting · {queue.reported.length} reported · {queue.upcoming.length} live ·{" "}
          <Link className="underline" href="/admin/orgs">Chapters queue</Link>
        </p>
      </div>

      {error && (
        <div className="card p-4 border-danger-200 bg-danger-50 text-danger-ink text-sm">
          {error.message} — has migration 090 been applied?
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Waiting for review</h2>
        {queue.pending.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">Nothing waiting.</div>
        ) : (
          <ul className="space-y-3">
            {queue.pending.map((e) => (
              <li key={e.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {e.org_letters} {e.org_name} · {e.category}
                      {e.updated_at !== e.created_at ? " · edited" : ""}
                    </p>
                    <h3 className="font-display font-bold text-lg text-ink-900">{e.title}</h3>
                    <p className="text-sm text-ink-700">
                      {when(e.starts_at)} → {when(e.ends_at)}
                      {e.capacity ? ` · ${e.capacity} spots` : ""}
                    </p>
                    <p className="text-sm text-ink-700 inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {e.venue_kind}: {e.venue_label}
                      {e.area_label ? ` (strangers see “${e.area_label}”)` : ""}
                      {e.lat !== null && e.lng !== null && (
                        <a className="underline ml-1" target="_blank" rel="noreferrer"
                          href={`https://maps.apple.com/?ll=${e.lat},${e.lng}&q=${encodeURIComponent(e.title)}`}>map</a>
                      )}
                    </p>
                    {e.description && <p className="mt-2 text-sm text-ink-700 whitespace-pre-line">{e.description}</p>}
                    <p className="mt-2 text-xs text-ink-400 font-mono">posted by {e.posted_by} · {e.posted_by_email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <RpcActionButton endpoint={endpoint} tone="good" icon={Check} label="Approve"
                      body={{ action: "review", event_id: e.id, approve: true }} />
                    <RpcActionButton endpoint={endpoint} tone="bad" icon={X} label="Reject"
                      promptReason="Why? The officer sees this, e.g. “Events with alcohol aren't allowed.”"
                      body={{ action: "review", event_id: e.id, approve: false }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Reported</h2>
        {queue.reported.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">No open reports.</div>
        ) : (
          <ul className="space-y-3">
            {queue.reported.map((e) => (
              <li key={e.id} className="card p-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-ink-900">
                    {e.title} <span className="text-xs text-ink-400">({e.status})</span>
                  </h3>
                  <p className="text-sm text-ink-700">{e.org_name} · {when(e.starts_at)} · {e.venue_label}</p>
                  <p className="text-sm text-danger-ink">{e.reports} report{e.reports === 1 ? "" : "s"}: {e.reasons.join(", ")}</p>
                  {e.notes.map((n, i) => <p key={i} className="text-sm text-ink-500">“{n}”</p>)}
                </div>
                <div className="flex gap-1.5">
                  {e.status === "approved" && (
                    <>
                      <RpcActionButton endpoint={endpoint} tone="bad" icon={EyeOff} label="Take down"
                        body={{ action: "status", event_id: e.id, status: "hidden" }} />
                      <RpcActionButton endpoint={endpoint} icon={Eye} label="Dismiss reports"
                        body={{ action: "status", event_id: e.id, status: "approved" }} />
                    </>
                  )}
                  {e.status === "hidden" && (
                    <RpcActionButton endpoint={endpoint} icon={Eye} label="Restore"
                      confirm={`Put “${e.title}” back on the map?`}
                      body={{ action: "status", event_id: e.id, status: "approved" }} />
                  )}
                  {e.status !== "approved" && e.status !== "hidden" && (
                    <RpcActionButton endpoint={endpoint} icon={EyeOff} label="Hide & resolve"
                      body={{ action: "status", event_id: e.id, status: "hidden" }} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900 mb-3">Live and upcoming</h2>
        {queue.upcoming.length === 0 ? (
          <div className="card p-8 text-center text-ink-500">None.</div>
        ) : (
          <ul className="card divide-y divide-cream-200">
            {queue.upcoming.map((e) => (
              <li key={e.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-700">
                <span><strong>{e.title}</strong> · {e.org_name} · {when(e.starts_at)} · {e.venue_label} · {e.rsvps} going</span>
                <RpcActionButton endpoint={endpoint} tone="bad" icon={EyeOff} label="Take down"
                  confirm={`Take down “${e.title}”?`}
                  body={{ action: "status", event_id: e.id, status: "hidden" }} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
