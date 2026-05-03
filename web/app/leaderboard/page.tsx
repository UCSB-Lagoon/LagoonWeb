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
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber/10 text-amber ring-1 ring-amber/15">
          <Trophy className="w-6 h-6" />
        </span>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.05em]">Weekly leaderboard</h1>
      </header>
      <p className="text-mist/60 mb-6">
        Resets every Monday. Earn XP by checking in, rating, and completing
        challenges across UCSB.
      </p>
      <LeaderboardTable rows={rows} />
    </div>
  );
}
