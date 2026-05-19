import { createClient } from "@/lib/supabase/server";
import { weekStart } from "@/lib/utils";
import { applyStatsFloor, statsScale, statsFloor } from "@/lib/public-stats-baseline";
import type { LeaderRow } from "@/components/gamification/leaderboard-table";

type ActivityFeedRow = {
  id: string;
  user_id: string;
  source: string;
  points: number;
  context: string | null;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
};

type WeeklyChallenge = {
  id: number;
  week_start: string;
  slug: string;
  title: string;
  description: string;
  target_source: string;
  target_count: number;
  xp_reward: number;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  major_code: string | null;
};

type GamificationRow = {
  user_id: string;
  xp_total: number;
  level: number;
  streak_days: number;
};

type WeekXpRow = {
  created_at: string;
  xp_awarded: number;
};

export async function getActivityFeed(limit = 20) {
  const sb = (await createClient()) as any;
  const { data } = await sb
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityFeedRow[];
}

export async function getWeeklyLeaderboard(limit = 10): Promise<LeaderRow[]> {
  const sb = (await createClient()) as any;
  const week = weekStart();
  const { data: lb } = await sb
    .from("leaderboard_weekly")
    .select("user_id, rank, xp")
    .eq("week_start", week)
    .order("rank", { ascending: true })
    .limit(limit);

  if (!lb || lb.length === 0) return [];

  const rows = lb as Array<{ user_id: string; rank: number; xp: number }>;
  const ids = rows.map((r) => r.user_id);
  const [{ data: profiles }, { data: stats }] = await Promise.all([
    sb.from("user_profiles")
      .select("id, display_name, full_name, avatar_url, major_code")
      .in("id", ids),
    sb.from("user_gamification_profiles")
      .select("user_id, xp_total, level")
      .in("user_id", ids),
  ]);

  const pMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]));
  const sMap = new Map((stats as GamificationRow[] | null)?.map((s) => [s.user_id, s]));

  return rows.map((r) => {
    const p = pMap.get(r.user_id);
    const s = sMap.get(r.user_id);
    return {
      user_id: r.user_id,
      rank: r.rank,
      xp: r.xp,
      total_xp: s?.xp_total ?? 0,
      level: s?.level ?? 1,
      display_name: p?.display_name ?? p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      tagline: p?.major_code ?? null,
    };
  });
}

export async function getAllTimeLeaderboard(limit = 50): Promise<LeaderRow[]> {
  const sb = (await createClient()) as any;
  const { data: stats } = await sb
    .from("user_gamification_profiles")
    .select("user_id, xp_total, level")
    .order("xp_total", { ascending: false })
    .limit(limit);

  const rows = (stats ?? []) as Array<{ user_id: string; xp_total: number; level: number }>;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await sb
    .from("user_profiles")
    .select("id, display_name, full_name, avatar_url, major_code")
    .in("id", ids);
  const pMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]));

  return rows.map((r, i) => {
    const p = pMap.get(r.user_id);
    return {
      user_id: r.user_id,
      rank: i + 1,
      xp: r.xp_total,
      total_xp: r.xp_total,
      level: r.level ?? 1,
      display_name: p?.display_name ?? p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      tagline: p?.major_code ?? null,
    };
  });
}

export async function getVibeScore(): Promise<number> {
  const sb = (await createClient()) as any;
  const since1h  = new Date(Date.now() - 3600_000).toISOString();
  const [{ count: hour }, { count: day }] = await Promise.all([
    sb.from("activity_feed").select("*", { count: "exact", head: true }).gte("created_at", since1h),
    sb.from("activity_feed").select("*", { count: "exact", head: true }),
  ]);
  if (!day || day === 0) return 0;
  const hourlyAvg = day / 24;
  if (hourlyAvg === 0) return 0;
  return Math.min(1, (hour ?? 0) / (hourlyAvg * 1.6));
}

export async function getActiveChallenges() {
  const sb = (await createClient()) as any;
  const week = weekStart();
  const { data } = await sb
    .from("weekly_challenges")
    .select("*")
    .eq("week_start", week)
    .order("xp_reward", { ascending: false });
  return (data ?? []) as WeeklyChallenge[];
}

export async function getMe() {
  const sb = (await createClient()) as any;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: stats }, { data: badges }, { data: weekXp }] = await Promise.all([
    sb.from("user_profiles").select("*").eq("id", user.id).single(),
    sb.from("user_gamification_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("user_badges")
      .select("badge_id, earned_at, badge_catalog(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false }),
    sb.from("user_xp_events")
      .select("created_at, xp_awarded")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
  ]);
  return {
    user,
    profile: profile as (ProfileRow & { email?: string }) | null,
    stats: stats as GamificationRow | null,
    badges: badges ?? [],
    weekXp: (weekXp ?? []) as WeekXpRow[],
  };
}

export async function getXpStats() {
  const sb = (await createClient()) as any;
  const week = weekStart();
  // Use the (anon-readable) matview + activity_feed view — bare user_xp_events
  // is RLS-locked to the owner, so anon counts return 0.
  const [{ data: lb }, { data: feed24h }, { count: activeUsers }] = await Promise.all([
    sb.from("leaderboard_weekly").select("xp").eq("week_start", week),
    sb.from("activity_feed").select("id"),
    sb.from("user_gamification_profiles").select("*", { count: "exact", head: true }),
  ]);
  const leaderboardRows = (lb ?? []) as Array<{ xp: number | null }>;
  return {
    xpThisWeek: leaderboardRows.reduce((sum: number, row) => sum + (row.xp ?? 0), 0),
    weekEvents: feed24h?.length ?? 0,    // last-24h actions; closest public proxy
    // Floored to the shared baseline so the hub can't contradict the /stats
    // and marketing headline (same single source of truth).
    activeUsers: Math.max(activeUsers ?? 0, statsFloor().users),
  };
}


export type TrendingClass = { course_key: string; vibes: number; mood: string };

const MOOD_TO_SCORE: Record<string, number> = { great: 5, good: 4, okay: 3, meh: 2, bad: 1 };
const SCORE_TO_LABEL = ["", "Brutal", "Heavy", "Steady", "Solid", "Loved"];

export async function getTrendingClasses(limit = 5): Promise<TrendingClass[]> {
  const sb = (await createClient()) as any;
  const { data } = await sb
    .from("class_vibes")
    .select("course_key, rating");
  const rows = (data ?? []) as Array<{ course_key: string; rating: string }>;
  const agg = new Map<string, { n: number; sum: number }>();
  for (const r of rows) {
    const score = MOOD_TO_SCORE[r.rating] ?? 3;
    const cur = agg.get(r.course_key) ?? { n: 0, sum: 0 };
    agg.set(r.course_key, { n: cur.n + 1, sum: cur.sum + score });
  }
  return Array.from(agg.entries())
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, limit)
    .map(([course_key, v]) => ({
      course_key,
      vibes: v.n,
      mood: SCORE_TO_LABEL[Math.round(v.sum / v.n)] ?? "Steady",
    }));
}

export type StatsOverview = {
  total_users: number; active_users_14d: number;
  lifetime_xp: number; lifetime_events: number;
  badges_earned: number; top_streak: number;
  friendships: number; class_vibes: number;
};

export async function getStatsBundle() {
  const sb = (await createClient()) as any;
  const [overview, sources, daily, majors, classLevels, badgeRarity, topBadges] =
    await Promise.all([
      sb.from("stats_overview").select("*").single(),
      sb.from("stats_xp_by_source").select("*"),
      sb.from("stats_xp_daily").select("*"),
      sb.from("stats_majors").select("*"),
      sb.from("stats_class_levels").select("*"),
      sb.from("stats_badges_by_rarity").select("*"),
      sb.from("stats_top_badges").select("*").limit(8),
    ]);
  // Scale every breakdown by the same factor that floors the headline so the
  // whole page stays internally consistent (charts sum to the shown totals).
  const sc = statsScale(overview.data ?? null);
  const su = (n: number) => Math.round(n * sc.users);
  const sx = (n: number) => Math.round(n * sc.xp);

  const sourcesArr = (sources.data ?? []) as Array<{ source: string; event_count: number; total_xp: number; avg_xp: number }>;
  const dailyArr   = (daily.data ?? []) as Array<{ day: string; event_count: number; active_users: number; total_xp: number }>;
  const majorsArr  = (majors.data ?? []) as Array<{ major_code: string; users: number }>;
  const classArr   = (classLevels.data ?? []) as Array<{ class_level: string; users: number }>;
  const rarityArr  = (badgeRarity.data ?? []) as Array<{ rarity: string; available: number; earned: number }>;
  const topBadgeArr = (topBadges.data ?? []) as Array<{ badge_id: string; title: string; icon: string; rarity: string; earned_count: number }>;

  return {
    overview: applyStatsFloor(overview.data ?? null) as StatsOverview | null,
    scale: sc,
    sources: sourcesArr.map((r) => ({ ...r, event_count: sx(r.event_count), total_xp: sx(r.total_xp) })),
    daily:   dailyArr.map((r) => ({ ...r, event_count: sx(r.event_count), total_xp: sx(r.total_xp), active_users: su(r.active_users) })),
    majors:  majorsArr.map((r) => ({ ...r, users: su(r.users) })),
    classLevels: classArr.map((r) => ({ ...r, users: su(r.users) })),
    badgeRarity: rarityArr.map((r) => ({ ...r, earned: su(r.earned) })),
    topBadges:   topBadgeArr.map((r) => ({ ...r, earned_count: su(r.earned_count) })),
  };
}

export async function getStreakDistribution(): Promise<Array<{ bucket: string; users: number }>> {
  const sb = (await createClient()) as any;
  const { data } = await sb
    .from("user_gamification_profiles")
    .select("streak_days");
  const rows = (data ?? []) as Array<{ streak_days: number | null }>;
  const buckets = [
    { label: "0",       min: 0,  max: 0   },
    { label: "1–2",     min: 1,  max: 2   },
    { label: "3–6",     min: 3,  max: 6   },
    { label: "7–13",    min: 7,  max: 13  },
    { label: "14–29",   min: 14, max: 29  },
    { label: "30+",     min: 30, max: 1e9 },
  ];
  return buckets.map((b) => ({
    bucket: b.label,
    users: rows.filter((r) => {
      const s = r.streak_days ?? 0;
      return s >= b.min && s <= b.max;
    }).length,
  }));
}

export async function getTopStreaks(limit = 5): Promise<Array<{ user_id: string; streak_days: number; display_name: string | null; level: number; major: string | null; }>> {
  const sb = (await createClient()) as any;
  const { data: tops } = await sb
    .from("user_gamification_profiles")
    .select("user_id, streak_days, level")
    .order("streak_days", { ascending: false })
    .limit(limit);
  const rows = (tops ?? []) as Array<{ user_id: string; streak_days: number; level: number }>;
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await sb
    .from("user_profiles")
    .select("id, display_name, full_name, major_code")
    .in("id", ids);
  const pMap = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = pMap.get(r.user_id);
    return {
      user_id: r.user_id,
      streak_days: r.streak_days,
      display_name: p?.display_name ?? p?.full_name ?? null,
      level: r.level ?? 1,
      major: p?.major_code ?? null,
    };
  });
}

export async function getTopStreak() {
  const sb = (await createClient()) as any;
  const { data } = await sb
    .from("user_gamification_profiles")
    .select("streak_days")
    .order("streak_days", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.streak_days ?? 0;
}
