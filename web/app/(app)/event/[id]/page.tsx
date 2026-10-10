import type { Metadata } from "next";
import Link from "next/link";
import { ShareCTA } from "@/components/share/share-cta";
import { logShareClick } from "@/lib/share-click";
import { categoryTitle, fetchPublicOrgEvent, goingLine, hasEnded, hostLabel, whenLine } from "@/lib/orgs-public";

/**
 * /event/{id} — a chapter's event, shared from the app. Approved events only
 * (every one is reviewed by hand). An event at a private house shows its
 * block, never the address: that's for people who RSVP in the app, where
 * the host can see who's coming.
 */

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string; s?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchPublicOrgEvent(id);
  if (!event) return { title: "Event not found", robots: { index: false } };
  const title = `${event.title} · ${hostLabel(event)}`;
  const going = goingLine(event);
  const description = `${whenLine(event)} · ${event.venue_label}${going ? ` · ${going}` : ""}. RSVP in Lagoon.`;
  const url = `https://www.lagoonucsb.com/event/${event.id}`;
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Lagoon", title, description, url },
    twitter: { card: "summary_large_image", title, description },
    other: { "apple-itunes-app": `app-id=6760681142, app-argument=https://lagoonucsb.com/event/${event.id}` },
  };
}

export default async function OrgEventPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { r, s } = await searchParams;
  const event = await fetchPublicOrgEvent(id);
  await logShareClick(`/event/${id}`, r, s || "org_event");

  if (!event) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">This event isn&apos;t on Lagoon anymore.</h1>
        <p className="mt-4 text-lg text-ink-500">It may have been cancelled or moved. Chapters&apos; current events are in the app.</p>
        <ShareCTA kind="org_event" appPath="friends" label="Get Lagoon free" />
      </div>
    );
  }

  const ended = hasEnded(event);
  const going = goingLine(event);
  return (
    <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
      <p className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">
        <Link href={`/org/${event.org_slug}`} className="hover:underline underline-offset-4">{hostLabel(event)}</Link>
        {" · "}
        {categoryTitle(event.category)}
      </p>
      <h1 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.04] font-extrabold tracking-[-0.03em] text-ink-900">
        {event.title}
      </h1>
      <p className="mt-4 text-xl font-bold text-ink-900">
        {ended ? (
          <span className="text-ink-500">Ended · {whenLine(event)}</span>
        ) : (
          <mark className="px-1 rounded-sm bg-gold-500 text-on-accent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            {whenLine(event)}
          </mark>
        )}
      </p>
      <p className="mt-2 text-base text-ink-700">{event.venue_label}</p>
      {event.is_approximate && !ended ? (
        <p className="mt-1 text-sm text-ink-500">The address is shown to people who RSVP in the app.</p>
      ) : null}
      {going ? <p className="mt-2 text-base text-ink-700">{going}</p> : null}

      {ended ? (
        <ShareCTA kind="org_event" appPath={`org/${event.org_slug}`} label={`See what ${event.org_letters ?? event.org_name} has next`} />
      ) : (
        <ShareCTA
          kind="org_event"
          appPath={`event/${event.id}`}
          label={event.is_approximate ? "RSVP to see the address — get Lagoon free" : "RSVP in Lagoon — free"}
          note="See which of your friends are going and get a reminder before it starts."
        />
      )}

      {event.description ? (
        <section className="mt-12">
          <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Details</h2>
          <p className="mt-2 text-base leading-relaxed text-ink-700 whitespace-pre-line">{event.description}</p>
        </section>
      ) : null}

      <p className="mt-10 text-sm font-semibold text-ink-700">
        <Link href={`/org/${event.org_slug}`} className="underline underline-offset-4">
          More from {event.org_name}
        </Link>
      </p>
      <p className="mt-6 text-xs text-ink-400">
        Posted by {event.org_name}&apos;s verified officers and reviewed by Lagoon before it went up.{" "}
        <Link href="/" className="underline underline-offset-2">What&apos;s Lagoon?</Link>
      </p>
    </div>
  );
}
