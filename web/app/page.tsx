import Link from "next/link";
import { Trophy, Sparkles, Users, Flame, ArrowRight } from "lucide-react";
import { ActivityFeed } from "@/components/gamification/activity-feed";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { VibeMeter } from "@/components/gamification/vibe-meter";
import { StatCard } from "@/components/ui/stat-card";
import {
  getActivityFeed,
  getVibeScore,
  getWeeklyLeaderboard,
  getXpStats,
  getTopStreak,
} from "@/lib/queries";

export const revalidate = 30;

export default async function HomePage() {
  const [feed, top, vibe, stats, topStreak] = await Promise.all([
    getActivityFeed(20),
    getWeeklyLeaderboard(5),
    getVibeScore(),
    getXpStats(),
    getTopStreak(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* hero */}
      <section className="wave-bg rounded-3xl px-6 sm:px-12 py-16 mt-6 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-lagoon-300/80 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Live · UCSB
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] font-semibold">
            Everything happening at <span className="text-gradient-lagoon">UCSB</span>,
            in one lagoon.
          </h1>
          <p className="mt-5 text-lg text-mist/70 max-w-xl">
            Live ratings, weekly leaderboards, campus vibe checks, and badges for the
            things you already do. Compete with your dorm. Crown a dining hall.
            Become a Lagoon Legend.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-lagoon-400 text-deep px-5 py-2.5 font-semibold hover:bg-lagoon-300 glow-lagoon transition"
            >
              Join the lagoon <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 font-medium hover:bg-lagoon-200/10 transition"
            >
              <Trophy className="w-4 h-4" /> See the leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <StatCard label="Active Gauchos" value={stats.activeUsers}  icon={Users}    accent="#22d3ee" />
        <StatCard label="XP this week"   value={stats.xpThisWeek}   icon={Sparkles} accent="#4ade80" />
        <StatCard label="Actions / week" value={stats.weekEvents}   icon={Trophy}   accent="#fb7185" />
        <StatCard label="Top streak"     value={`${topStreak}d`}    icon={Flame}    accent="#fde68a" />
      </section>

      {/* main grid */}
      <section className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <VibeMeter score={vibe} />

          <div className="glass rounded-2xl p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-lg">This week's leaderboard</h2>
              <Link href="/leaderboard" className="text-sm text-lagoon-300 hover:text-lagoon-200">
                Full board →
              </Link>
            </div>
            <LeaderboardTable rows={top} />
          </div>
        </div>

        <div>
          <div className="glass rounded-2xl p-5 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg">Live activity</h2>
              <span className="flex items-center gap-1.5 text-xs text-lagoon-300">
                <span className="w-2 h-2 rounded-full bg-kelp-400 animate-pulse-soft" />
                live
              </span>
            </div>
            <ActivityFeed initial={feed} />
          </div>
        </div>
      </section>
    </div>
  );
}
