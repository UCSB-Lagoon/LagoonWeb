import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { getWeeklyLeaderboard } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const rows = await getWeeklyLeaderboard(50);
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <header className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 border border-orange-200 text-orange-600">
          <Trophy className="w-5 h-5" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">Weekly leaderboard</h1>
          <p className="text-sm text-ink-500 mt-0.5">Resets every Monday · Earn XP across the Lagoon mobile app</p>
        </div>
      </header>
      <div className="card p-4 sm:p-5">
        <LeaderboardTable rows={rows} />
      </div>
    </div>
  );
}
