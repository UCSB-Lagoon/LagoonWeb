import type { Metadata } from "next";
import { CampusHeading, CampusNav } from "@/components/campus-heading";
import { StatCard } from "@/components/ui/stat-card";
import { BarRow } from "@/components/charts/bar-row";
import { ActivityArea } from "@/components/charts/activity-area";
import { getStatsBundle } from "@/lib/queries";
import {
  fillActivity,
  laCalendarDays,
  prettifyMajor,
  sliceWindow,
  sumBy,
} from "@/lib/stats-helpers";

export const revalidate = 30;
export const metadata: Metadata = {
  title: "Campus by the numbers",
  description:
    "Explore Lagoon’s UCSB community: student sign-ups, active Gauchos, friendships, daily activity and majors.",
  alternates: { canonical: "https://lagoonucsb.com/stats" },
  openGraph: {
    type: "website",
    title: "Campus by the numbers — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, including how this week compares with the last.",
    url: "https://lagoonucsb.com/stats",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        alt: "Lagoon — the UCSB campus app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus by the numbers — Lagoon",
    description:
      "Lagoon's real, anonymized UCSB numbers, including how this week compares with the last.",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        alt: "Lagoon — the UCSB campus app",
      },
    ],
  },
};

export default async function StatsPage() {
  const stats = await getStatsBundle();
  const overview = stats.overview;
  const daily = fillActivity(
    stats.daily.map((d) => ({
      day: d.day,
      event_count: d.event_count ?? 0,
      active_users: d.active_users ?? 0,
      total_xp: d.total_xp ?? 0,
    })),
    laCalendarDays(30),
  );
  const week = sliceWindow(daily, 7, 0);
  const majors = stats.majors
    .slice(0, 8)
    .map((m) => ({ label: prettifyMajor(m.major_code), value: m.users }));
  return (
    <div className="campus-page">
      <CampusHeading
        eyebrow="LAGOON / BY THE NUMBERS"
        title="A campus, coming together."
        description="A straightforward look at the community using Lagoon. Real counts, no inflated milestones."
      />
      <CampusNav current="/stats" />
      {!overview ? (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-ink-900">
            Numbers are temporarily unavailable.
          </h2>
          <p className="mt-2 text-ink-500">
            Check back soon for the latest campus activity.
          </p>
        </div>
      ) : (
        <>
          <section className="campus-stat-strip" aria-label="Community totals">
            <StatCard
              label="Gauchos on Lagoon"
              value={overview.total_users ?? 0}
              hint="All sign-ups"
            />
            <StatCard
              label="Active Gauchos"
              value={overview.active_users_14d ?? 0}
              hint="Over the last 14 days"
            />
            <StatCard
              label="Actions this week"
              value={sumBy(week, (d) => d.event_count)}
              hint="Over the last 7 days"
            />
            <StatCard
              label="Friendships"
              value={overview.friendships ?? 0}
              hint="Connections formed"
            />
          </section>
          <section className="card p-6 mt-8">
            <div className="campus-card-heading">
              <h2>The last 30 days</h2>
              <span>Daily activity</span>
            </div>
            <p className="text-xs text-ink-500 mb-4">
              Gold area: XP earned (left axis). Blue line: active Gauchos (right
              axis).
            </p>
            <ActivityArea data={daily} />
          </section>
          <section className="campus-data-grid">
            <div className="card p-6">
              <div className="campus-card-heading">
                <h2>Across campus</h2>
                <span>Top majors</span>
              </div>
              {majors.length ? (
                <BarRow items={majors} />
              ) : (
                <p className="text-ink-500">
                  Major information will appear as students join.
                </p>
              )}
            </div>
            <div className="campus-data-note">
              <span>SMALL CONNECTIONS. BIG CAMPUS.</span>
              <h2>
                Behind every number,
                <br />a fellow Gaucho.
              </h2>
              <p>
                Find classmates, compare schedules, and make campus feel a
                little more familiar.
              </p>
              <a
                href="https://apps.apple.com/us/app/ucsb-lagoon/id6760681142"
                className="lagoon-button"
                data-lagoon-cta="stats"
              >
                Find your people ↗
              </a>
            </div>
          </section>
        </>
      )}
      <p className="campus-methodology">
        Aggregate Lagoon activity, not university-wide statistics. Data is
        cached for 30 seconds; reload for an updated view. Daily totals use
        Pacific time.
      </p>
    </div>
  );
}
