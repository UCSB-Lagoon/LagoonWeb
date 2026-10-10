import type { Metadata } from "next";
import Link from "next/link";
import { FreeHeatmap } from "@/components/share/free-heatmap";
import { ShareCTA } from "@/components/share/share-cta";
import { logShareClick } from "@/lib/share-click";
import {
  fetchFreeGroup,
  headline,
  isWholeDay,
  longDayName,
  membersLine,
  range,
  dayName,
} from "@/lib/share";

/**
 * /f/{id} — a "When are we free?" group. Readable by anyone with the link,
 * no account: who's in, the times everyone with a schedule is free, and a
 * heatmap of the week. Joining happens in the app, which is the point —
 * every friend who wants the answer adds their schedule.
 */

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string; s?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const group = await fetchFreeGroup(id);
  if (!group) return { title: "When are we free?", robots: { index: false } };
  const h = headline(group);
  const title = group.title ? `${group.title} · When are we free?` : `When are we free? · ${group.created_by_name}`;
  const description = h.mark
    ? `${h.lead} ${h.mark}. ${membersLine(group)}. Add your schedule in Lagoon to count.`
    : `${membersLine(group)}. Add your schedule in Lagoon and it finds the times you're all free.`;
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `https://www.lagoonucsb.com/f/${group.id}` },
    openGraph: { type: "website", siteName: "Lagoon", title, description, url: `https://www.lagoonucsb.com/f/${group.id}` },
    twitter: { card: "summary_large_image", title, description },
    other: { "apple-itunes-app": `app-id=6760681142, app-argument=https://lagoonucsb.com/f/${group.id}` },
  };
}

export default async function FreeGroupPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { r, s } = await searchParams;
  const group = await fetchFreeGroup(id);
  await logShareClick(`/f/${id}`, r, s || "free_group");

  if (!group) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">This link has expired.</h1>
        <p className="mt-4 text-lg text-ink-500">
          Groups last a quarter. Ask whoever sent it for a new one, or make your own in Lagoon.
        </p>
        <ShareCTA kind="free_group" appPath="friends" label="Get Lagoon free" />
      </div>
    );
  }

  const h = headline(group);
  return (
    <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
      <p className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">
        {group.title ?? `${group.created_by_name}'s group`} · When are we free?
      </p>
      <h1 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.04] font-extrabold tracking-[-0.03em] text-ink-900">
        {h.lead}
        {h.mark ? (
          <>
            <br />
            <mark className="px-1 rounded-sm bg-gold-500 text-on-accent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
              {h.mark}
            </mark>
          </>
        ) : null}
      </h1>
      <p className="mt-4 text-base text-ink-500">{membersLine(group)}</p>

      <ShareCTA
        kind="free_group"
        appPath={`free/${group.id}`}
        label="Add my schedule — get Lagoon free"
        note="Lagoon reads your GOLD schedule in about 30 seconds. No one in the group sees your classes, only when you're free."
      />

      {group.scheduled_count >= 2 && group.best.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Everyone&apos;s free</h2>
          <ul className="mt-3 divide-y divide-cream-200 border-y border-cream-200">
            {group.best.map((w, i) => (
              <li key={i} className="flex items-baseline gap-4 py-3">
                <span className="w-10 font-mono text-sm text-ink-400">{dayName(w.d)}</span>
                <span className="font-semibold text-ink-900">
                  {isWholeDay(w, group) ? `All day — no one has class ${longDayName(w.d)}` : range(w.s, w.e)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {group.scheduled_count >= 1 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-black tracking-[0.14em] uppercase text-ink-500">The week</h2>
          <FreeHeatmap group={group} />
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">Who&apos;s in</h2>
        <ul className="mt-3 divide-y divide-cream-200">
          {group.members.map((m, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <span className="font-semibold text-ink-900">{m.name}</span>
              <span className={m.has_schedule ? "text-sm text-ink-700" : "text-sm text-ink-400"}>
                {m.has_schedule ? "Schedule in" : "No classes yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs text-ink-400">
        Free times come from everyone&apos;s classes in Lagoon, Monday to Friday, 8 AM to 8 PM.{" "}
        <Link href="/" className="underline underline-offset-2">What&apos;s Lagoon?</Link>
      </p>
    </div>
  );
}
