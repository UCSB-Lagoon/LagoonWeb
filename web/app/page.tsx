import Link from "next/link";
import { Trophy, Sparkles, Users, Flame, ArrowRight, Activity } from "lucide-react";
import { ActivityFeed } from "@/components/gamification/activity-feed";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { VibeMeter } from "@/components/gamification/vibe-meter";
import { StatCard } from "@/components/ui/stat-card";
import { TrendingClassesCard } from "@/components/widgets/trending-classes";
import {
  getActivityFeed,
  getVibeScore,
  getWeeklyLeaderboard,
  getXpStats,
  getTopStreak,
  getTrendingClasses,
} from "@/lib/queries";

export const revalidate = 30;

export default async function HomePage() {
  const [feed, top, vibe, stats, topStreak, classes] = await Promise.all([
    getActivityFeed(20),
    getWeeklyLeaderboard(5),
    getVibeScore(),
    getXpStats(),
    getTopStreak(),
    getTrendingClasses(5),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-5">
      {/* Hero */}
      <section className="pt-12 pb-10 sm:pt-20 sm:pb-14">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="pill mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Live across UCSB
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.04em] leading-[0.98] text-ink-900">
              The student hub<br />
              UCSB <span className="italic-accent">deserves.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-500 max-w-xl leading-relaxed">
              Real-time leaderboards, class vibes, and gamified daily
              life — built on the same data powering the Lagoon mobile app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Join the Lagoon <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/leaderboard" className="btn-secondary">
                <Trophy className="w-4 h-4 text-orange-500" /> See the leaderboard
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2 text-xs">
              {["Grades", "Schedules", "Live map", "Classmates", "Dining", "Events"].map((t) => (
                <span key={t} className="rounded-full border border-cream-200 bg-white px-3 py-1.5 text-ink-500 font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Hero side card — live vibe + top race */}
          <div className="lg:col-span-5">
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-orange-200/50 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-[0.18em] text-ink-400 font-semibold">Right now</span>
                  <span className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-[pulse-soft_2s_ease-in-out_infinite]" />
                    live
                  </span>
                </div>
                <p className="font-serif italic text-3xl text-ink-900 leading-tight">
                  {stats.activeUsers} Gauchos<br />
                  <span className="text-orange-500">earning XP</span>
                </p>
                <p className="mt-3 text-sm text-ink-500">
                  {stats.weekEvents.toLocaleString()} actions in the last 24h · top streak {topStreak} days
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-cream-100 border border-cream-200 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">Vibe</p>
                    <p className="font-bold text-ink-900">
                      {vibe > 0.65 ? "Buzzing" : vibe > 0.4 ? "Steady" : vibe > 0.2 ? "Mellow" : "Quiet"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cream-100 border border-cream-200 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">XP This Week</p>
                    <p className="font-bold text-ink-900 tabular-nums">{stats.xpThisWeek?.toLocaleString() ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="XP earners"     value={stats.activeUsers}  icon={Users}    hint="Gauchos with any XP" />
        <StatCard label="XP this week"   value={stats.xpThisWeek}   icon={Sparkles} hint="resets every Monday" />
        <StatCard label="Actions (24h)"  value={stats.weekEvents}   icon={Activity} hint="across the whole app" />
        <StatCard label="Top streak"     value={`${topStreak}d`}    icon={Flame}    hint="current record" />
      </section>

      {/* Two-column main grid */}
      <section className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <VibeMeter score={vibe} />

          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-ink-900">This week's leaderboard</h2>
              <Link href="/leaderboard" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                Full board →
              </Link>
            </div>
            <LeaderboardTable rows={top} />
          </div>

        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-ink-900">Live activity</h2>
              <span className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-[pulse-soft_2s_ease-in-out_infinite]" />
                live
              </span>
            </div>
            <ActivityFeed initial={feed} />
          </div>

          <TrendingClassesCard rows={classes} />
        </div>
      </section>

      {/* Closing band */}
      <section className="card-tinted mt-10 mb-12 px-6 sm:px-10 py-10 sm:py-14 text-center relative overflow-hidden">
        <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-orange-300/50 blur-3xl" />
        <div className="absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-amber-400/40 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Everything Gaucho. <span className="italic-accent">In one tide.</span>
          </h2>
          <p className="mt-3 text-ink-500 max-w-xl mx-auto">
            Same account as the mobile app. Sign in to see your XP, badges, friends,
            and your spot on the weekly board.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Sign in <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
