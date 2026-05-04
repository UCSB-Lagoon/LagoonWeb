import Link from "next/link";
import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { getWeeklyLeaderboard, getAllTimeLeaderboard } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Leaderboard" };

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
    <div className="max-w-3xl mx-auto px-5 py-12">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <Trophy className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">
            {heading}
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">{sub}</p>
        </div>
      </header>

      <div
        role="tablist"
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
          Want to see who&apos;s on top forever? <Link href="/leaderboard?period=all-time" className="text-orange-600 font-semibold hover:underline">Switch to all-time →</Link>
        </p>
      )}
    </div>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={[
        "px-4 py-1.5 rounded-full text-sm font-semibold transition",
        active
          ? "bg-white text-ink-900 shadow-sm border border-cream-200"
          : "text-ink-500 hover:text-ink-900",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
