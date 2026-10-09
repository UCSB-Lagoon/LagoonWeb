import type { Metadata } from "next";
import { ShareCTA } from "@/components/share/share-cta";
import { WeekGrid } from "@/components/share/week-grid";
import { logShareClick } from "@/lib/share-click";
import { courseList, fetchSharedWeek, type SharedWeek } from "@/lib/share";

/**
 * /w/{id} — a week (or next quarter's plan) someone shared from Lagoon.
 * The page shows the week first and the install second; the link preview
 * (opengraph-image.tsx) shows the week too.
 */

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ r?: string; s?: string }> };

export const dynamic = "force-dynamic";

function heading(w: SharedWeek): string {
  const whose = `${w.owner_name}'s`;
  if (w.kind === "plan") return `${whose} ${w.quarter_name ?? "next quarter"} plan.`;
  return `${whose} week.`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const week = await fetchSharedWeek(id);
  if (!week) return { title: "A week on Lagoon", robots: { index: false } };
  const title = heading(week).replace(/\.$/, "");
  const description = `${courseList(week)}. Taking any of these? Lagoon shows when you're both free.`;
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `https://lagoonucsb.com/w/${week.id}` },
    openGraph: { type: "website", siteName: "Lagoon", title, description, url: `https://lagoonucsb.com/w/${week.id}` },
    twitter: { card: "summary_large_image", title, description },
    other: { "apple-itunes-app": `app-id=6760681142, app-argument=https://lagoonucsb.com/w/${week.id}` },
  };
}

export default async function SharedWeekPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { r, s } = await searchParams;
  const week = await fetchSharedWeek(id);
  await logShareClick(`/w/${id}`, r, s || "week");

  if (!week) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">This week has expired.</h1>
        <p className="mt-4 text-lg text-ink-500">Shared weeks last 90 days. Make your own in Lagoon in about 30 seconds.</p>
        <ShareCTA kind="week" appPath="schedule" label="Get Lagoon free" />
      </div>
    );
  }

  const kind = week.kind === "plan" ? "registration_plan" : "week";
  return (
    <div className="max-w-xl mx-auto px-5 pt-14 pb-24">
      <p className="text-xs font-black tracking-[0.14em] uppercase text-ink-500">
        UCSB{week.quarter_name ? ` · ${week.quarter_name}` : ""}
      </p>
      <h1 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.04] font-extrabold tracking-[-0.03em] text-ink-900">
        {heading(week)}
      </h1>
      <p className="mt-4 text-base text-ink-500">{courseList(week, 8)}</p>

      <div className="mt-8">
        <WeekGrid blocks={week.blocks} />
      </div>

      <ShareCTA
        kind={kind}
        appPath={`week/${week.id}`}
        label={week.kind === "plan" ? "Taking any of these? Get Lagoon" : "See when you're both free — get Lagoon"}
        note="Lagoon reads your GOLD schedule in about 30 seconds, shows your day, and finds when friends are free."
      />
    </div>
  );
}
