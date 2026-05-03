import { Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { getWeeklyLeaderboard } from "@/lib/queries";

export const revalidate = 60;
export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const rows = await getWeeklyLeaderboard(50);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-center gap-3">
        <Trophy className="w-7 h-7 text-lagoon-300" />
        <h1 className="font-display text-3xl">Weekly leaderboard</h1>
      </header>
      <p className="text-mist/60 mb-6">
        Resets every Monday. Earn XP by checking in, rating, and completing
        challenges across UCSB.
      </p>
      <LeaderboardTable rows={rows} />
    </div>
  );
}
