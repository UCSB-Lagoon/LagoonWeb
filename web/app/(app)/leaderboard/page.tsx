import { CampusHeading, CampusNav } from "@/components/campus-heading";
import Link from "next/link";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { getWeeklyLeaderboard, getAllTimeLeaderboard } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Leaderboard", alternates: { canonical: "/leaderboard" } };

type Period = "weekly" | "all-time";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period: Period = sp?.period === "all-time" ? "all-time" : "weekly";

  const rows =
    period === "all-time"
      ? await getAllTimeLeaderboard(50)
      : await getWeeklyLeaderboard(50);

  const heading = period === "all-time" ? "All-time leaderboard" : "Weekly leaderboard";
  const sub =
    period === "all-time"
      ? "Top XP earners since Lagoon launched · Earn XP across the mobile app"
      : "Resets every Monday · Earn XP across the Lagoon mobile app";

  return (
    <div className="campus-page">
      <CampusHeading eyebrow="THE CAMPUS COMMUNITY" title={heading} description={sub} />
      <CampusNav current="/leaderboard" />

      <div
        role="navigation"
        aria-label="Leaderboard period"
        className="inline-flex items-center gap-1 mb-4 p-1 rounded-full border border-cream-200 bg-cream-100/60"
      >
        <Tab href="/leaderboard?period=weekly"  active={period === "weekly"}  label="This week" />
        <Tab href="/leaderboard?period=all-time" active={period === "all-time"} label="All time" />
      </div>

      <div className="card p-4 sm:p-5">
        <LeaderboardTable rows={rows} />
      </div>

      {period === "weekly" && (
        <p className="text-xs text-ink-400 mt-4 text-center">
          Want to see who&apos;s on top forever? <Link href="/leaderboard?period=all-time" className="text-gold-700 font-semibold hover:underline">Switch to all-time →</Link>
        </p>
      )}
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "px-4 py-1.5 rounded-full text-sm font-semibold transition",
        active
          ? "bg-panel-elevated text-ink-900 shadow-sm border border-cream-200"
          : "text-ink-500 hover:text-ink-900",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
