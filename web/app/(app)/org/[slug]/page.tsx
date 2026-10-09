import type { Metadata } from "next";
import Link from "next/link";
import { ShareCTA } from "@/components/share/share-cta";
import { OrgEventList } from "@/components/share/org-event-list";
import { logShareClick } from "@/lib/share-click";
import { councilShort, councilTitle, fetchPublicOrg, whenLine } from "@/lib/orgs-public";

/**
 * /org/{slug} — a chapter's page for people without the app. This is where
 * an officer's "Invite your chapter" link lands (the group chat, the
 * Instagram bio), so it shows the chapter and its upcoming events first and
 * only then the install. Nothing is ranked or rated here, by design.
 */

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ r?: string; s?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const org = await fetchPublicOrg(slug);
  if (!org) return { title: "Chapter not found", robots: { index: false } };
  const next = org.upcoming_events[0];
  const title = `${org.letters ? `${org.letters} ` : ""}${org.name} at UCSB · Lagoon`;
  const description = next
    ? `Next: ${next.title}, ${whenLine(next)}. See ${org.letters ?? org.name}'s events and RSVP in Lagoon.`
    : org.recruitment_note ?? `${councilTitle(org.council)} at UCSB. See events and which friends are in ${org.letters ?? org.name} on Lagoon.`;
  const url = `https://lagoonucsb.com/org/${org.slug}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Lagoon", title, description, url },
    twitter: { card: "summary_large_image", title, description },
    other: { "apple-itunes-app": `app-id=6760681142, app-argument=${url}` },
  };
}

export default async function OrgPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { r, s } = await searchParams;
  const org = await fetchPublicOrg(slug);
  await logShareClick(`/org/${slug}`, r, s || "org");

  if (!org) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">We couldn&apos;t find that chapter.</h1>
        <p className="mt-4 text-lg text-ink-500">
          Lagoon lists UCSB&apos;s recognized fraternities and sororities. Every one of them is in the app under People → Chapters.
        </p>
        <ShareCTA kind="org" appPath="friends" label="Get Lagoon free" />
      </div>
    );
  }

  const short = org.letters ?? org.name;
  return (
    <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
      <p className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">
        {councilShort(org.council)} · UCSB
      </p>
      <h1 className="mt-3 font-display text-[40px] sm:text-[52px] leading-[1.02] font-extrabold tracking-[-0.03em] text-ink-900">
        {org.letters ? (
          <>
            <mark className="px-1.5 rounded-sm bg-gold-500 text-on-accent">{org.letters}</mark>
            <br />
          </>
        ) : null}
        {org.name}
      </h1>
      {org.full_name && org.full_name !== org.name ? (
        <p className="mt-3 text-base text-ink-500">{org.full_name}</p>
      ) : null}
      {org.member_count ? (
        <p className="mt-2 text-base text-ink-700">{org.member_count} members on Lagoon</p>
      ) : null}

      {org.recruitment_note ? (
        <section className="mt-8 border-l-2 border-ink-900 pl-4">
          <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Recruitment</h2>
          <p className="mt-2 text-lg leading-snug text-ink-900">{org.recruitment_note}</p>
        </section>
      ) : null}

      <ShareCTA
        kind="org"
        appPath={`org/${org.slug}`}
        label={org.upcoming_events.length ? `RSVP in Lagoon — free` : `See ${short} in Lagoon — free`}
        note={`See which of your friends are in ${short}, RSVP to events, and get a reminder before they start.`}
      />

      {org.upcoming_events.length ? (
        <section className="mt-12">
          <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Coming up</h2>
          <OrgEventList events={org.upcoming_events} />
        </section>
      ) : null}

      {org.about || org.philanthropy ? (
        <section className="mt-10 space-y-6">
          {org.about ? (
            <div>
              <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">About</h2>
              <p className="mt-2 text-base leading-relaxed text-ink-700 whitespace-pre-line">{org.about}</p>
            </div>
          ) : null}
          {org.philanthropy ? (
            <div>
              <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Philanthropy</h2>
              <p className="mt-2 text-base text-ink-700">
                {org.philanthropy_url ? (
                  <a href={org.philanthropy_url} rel="noreferrer" className="underline underline-offset-4">{org.philanthropy}</a>
                ) : (
                  org.philanthropy
                )}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {org.instagram || org.website ? (
        <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-700">
          {org.instagram ? (
            <a href={`https://instagram.com/${org.instagram}`} rel="noreferrer" className="underline underline-offset-4">
              @{org.instagram}
            </a>
          ) : null}
          {org.website ? (
            <a href={org.website} rel="noreferrer" className="underline underline-offset-4">
              {org.website.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </a>
          ) : null}
        </p>
      ) : null}

      {!org.is_claimed ? (
        <p className="mt-10 text-sm text-ink-500">
          {org.name}&apos;s officers haven&apos;t claimed this page yet. Officers can claim it in the app: People → Chapters →{" "}
          {org.name} → I&apos;m an officer. We verify each one by hand.
        </p>
      ) : null}

      <p className="mt-10 text-xs text-ink-400">
        Lagoon lists UCSB&apos;s recognized chapters. Nothing is ranked or rated, and every event is reviewed before it&apos;s posted.{" "}
        <Link href="/" className="underline underline-offset-2">What&apos;s Lagoon?</Link>
      </p>
    </div>
  );
}
