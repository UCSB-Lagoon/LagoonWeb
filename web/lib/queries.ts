import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { weekStart } from "@/lib/utils";
import type { LeaderRow } from "@/components/gamification/leaderboard-table";
import { laDateString, laMidnightIso, rarityRank, shiftIsoDate } from "@/lib/stats-helpers";

/**
 * A note on the `as` casts left in this file.
 *
 * Row types now come straight from `types/database.ts` — nothing here casts
 * the client away any more. What remains is one narrow, deliberate pattern:
 * Postgres cannot prove NOT NULL through a view, so the generator types every
 * column of `activity_feed`, `leaderboard_weekly` and the `stats_*` views as
 * nullable even where the underlying table column is NOT NULL. The casts below
 * narrow those back to what the view actually returns.
 *
 * They are load-bearing: delete one and the typecheck fails. A cast against a
 * plain table, by contrast, is now always redundant — infer instead.
 */

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






export async function getActivityFeed(limit = 20) {
  const sb = await createClient();
  const { data } = await sb
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityFeedRow[];
}

export async function getWeeklyLeaderboard(limit = 10): Promise<LeaderRow[]> {
  const sb = await createClient();
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

  const pMap = new Map(profiles?.map((p) => [p.id, p]));
  const sMap = new Map(stats?.map((s) => [s.user_id, s]));

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
  const sb = await createClient();
  const { data: stats } = await sb
    .from("user_gamification_profiles")
    .select("user_id, xp_total, level")
    .order("xp_total", { ascending: false })
    .limit(limit);

  const rows = stats ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.user_id);
  const { data: profiles } = await sb
    .from("user_profiles")
    .select("id, display_name, full_name, avatar_url, major_code")
    .in("id", ids);
  const pMap = new Map(profiles?.map((p) => [p.id, p]));

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
  const sb = await createClient();
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
  const sb = await createClient();
  const week = weekStart();
  const { data } = await sb
    .from("weekly_challenges")
    .select("*")
    .eq("week_start", week)
    .order("xp_reward", { ascending: false });
  return data ?? [];
}

export async function getMe() {
  const sb = await createClient();
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
    profile,
    stats,
    badges: badges ?? [],
    weekXp: weekXp ?? [],
  };
}

export async function getXpStats() {
  const sb = await createClient();
  const week = weekStart();
  // Use the (anon-readable) matview + activity_feed view — bare user_xp_events
  // is RLS-locked to the owner, so anon counts return 0.
  const [{ data: lb }, { data: feed24h }, { count: activeUsers }] = await Promise.all([
    sb.from("leaderboard_weekly").select("xp").eq("week_start", week),
    sb.from("activity_feed").select("id"),
    sb.from("user_gamification_profiles").select("*", { count: "exact", head: true }),
  ]);
  const leaderboardRows = lb ?? [];
  return {
    xpThisWeek: leaderboardRows.reduce((sum: number, row) => sum + (row.xp ?? 0), 0),
    weekEvents: feed24h?.length ?? 0,    // last-24h actions; closest public proxy
    activeUsers: activeUsers ?? 0,
  };
}


export type TrendingClass = { course_key: string; vibes: number; mood: string };

const MOOD_TO_SCORE: Record<string, number> = { great: 5, good: 4, okay: 3, meh: 2, bad: 1 };
const SCORE_TO_LABEL = ["", "Brutal", "Heavy", "Steady", "Solid", "Loved"];

function moodLabel(avg: number) {
  return SCORE_TO_LABEL[Math.round(avg)] ?? "Steady";
}

/**
 * PostgREST caps a response at 1,000 rows and does not follow a view's
 * ORDER BY. Aggregates belong in SQL; this walks pages only when that view
 * is not deployed yet.
 */
async function eachPage<T>(
  fetch: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[] | null> {
  const page = 1000;
  const all: T[] = [];
  for (let from = 0; from < 50_000; from += page) {
    const { data, error } = await fetch(from, from + page - 1);
    if (error) return null;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < page) break;
  }
  return all;
}

function trendingFromRows(
  rows: Array<{ course_key: string; rating: string }>,
  limit: number,
): TrendingClass[] {
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
      mood: moodLabel(v.sum / v.n),
    }));
}

/**
 * `class_vibes` is not readable by anon, while `stats_overview.class_vibes`
 * counts it through the view owner. Prefer the public aggregate view; until
 * that migration is applied, aggregate on the server with the service role
 * and return only course totals — never a user id.
 */
async function vibeRowsAsOwner(): Promise<Array<{ course_key: string; rating: string }> | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const admin = createAdminClient();
    return eachPage((from, to) =>
      admin.from("class_vibes").select("course_key, rating").range(from, to),
    );
  } catch {
    return null;
  }
}

export async function getTrendingClasses(limit = 5): Promise<TrendingClass[]> {
  const sb = await createClient();
  const view = await sb
    .from("stats_class_vibe_totals")
    .select("course_key, vibes, avg_score")
    .order("vibes", { ascending: false })
    .limit(limit);
  if (!view.error && view.data) {
    return view.data
      .filter((r) => r.course_key && (r.vibes ?? 0) > 0)
      .map((r) => ({
        course_key: r.course_key as string,
        vibes: r.vibes ?? 0,
        mood: moodLabel(Number(r.avg_score ?? 3)),
      }));
  }

  const owned = await vibeRowsAsOwner();
  if (owned && owned.length > 0) return trendingFromRows(owned, limit);

  const rows = await eachPage<{ course_key: string; rating: string }>((from, to) =>
    sb.from("class_vibes").select("course_key, rating").range(from, to),
  );
  return trendingFromRows(rows ?? [], limit);
}

export type SignupDay = { day: string; signups: number };

/**
 * Daily signups on the Pacific calendar. Null when neither the aggregate
 * view nor a direct read succeeded — the page then omits the chart instead
 * of drawing a false zero.
 */
export async function getSignupSeries(days: string[]): Promise<SignupDay[] | null> {
  if (days.length === 0) return [];
  const sb = await createClient();
  const view = await sb
    .from("stats_signups_daily")
    .select("day, signups")
    .order("day", { ascending: true });
  if (!view.error && view.data) {
    const map = new Map(view.data.map((r) => [String(r.day).slice(0, 10), r.signups ?? 0]));
    return days.map((day) => ({ day, signups: map.get(day) ?? 0 }));
  }

  const start = laMidnightIso(shiftIsoDate(days[0], -1));
  const rows = await eachPage<{ created_at: string | null }>((from, to) =>
    sb.from("user_profiles")
      .select("created_at")
      .gte("created_at", start)
      .order("created_at", { ascending: true })
      .range(from, to),
  );
  if (!rows) return null;
  const counts = new Map(days.map((d) => [d, 0]));
  for (const r of rows) {
    if (!r.created_at) continue;
    const key = laDateString(new Date(r.created_at));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((day) => ({ day, signups: counts.get(day) ?? 0 }));
}

export type StatsOverview = {
  total_users: number; active_users_14d: number;
  lifetime_xp: number; lifetime_events: number;
  badges_earned: number; top_streak: number;
  friendships: number; class_vibes: number;
};

export async function getStatsBundle() {
  const sb = await createClient();
  const [overview, sources, daily, majors, classLevels, badgeRarity, topBadges] =
    await Promise.all([
      sb.from("stats_overview").select("*").limit(1).maybeSingle(),
      // A view's ORDER BY is not preserved through PostgREST. Order here,
      // or "the top source" is whichever row came back first.
      sb.from("stats_xp_by_source").select("*").order("total_xp", { ascending: false }),
      sb.from("stats_xp_daily").select("*").order("day", { ascending: true }),
      sb.from("stats_majors").select("*").order("users", { ascending: false }),
      sb.from("stats_class_levels").select("*").order("users", { ascending: false }),
      sb.from("stats_badges_by_rarity").select("*"),
      sb.from("stats_top_badges").select("*").order("earned_count", { ascending: false }).limit(8),
    ]);
  const sourcesArr = ((sources.data ?? []) as Array<{ source: string; event_count: number; total_xp: number; avg_xp: number }>)
    .filter((r) => r.source)
    .sort((a, b) => b.total_xp - a.total_xp);
  const dailyArr   = ((daily.data ?? []) as Array<{ day: string; event_count: number; active_users: number; total_xp: number }>)
    .filter((r) => r.day)
    .sort((a, b) => a.day.localeCompare(b.day));
  const majorsArr  = ((majors.data ?? []) as Array<{ major_code: string; users: number }>)
    .filter((r) => r.major_code)
    .sort((a, b) => b.users - a.users);
  const classArr   = ((classLevels.data ?? []) as Array<{ class_level: string; users: number }>)
    .filter((r) => r.class_level);
  const rarityArr  = ((badgeRarity.data ?? []) as Array<{ rarity: string; available: number; earned: number }>)
    .filter((r) => r.rarity)
    .sort((a, b) => rarityRank(a.rarity) - rarityRank(b.rarity));
  const topBadgeArr = ((topBadges.data ?? []) as Array<{ badge_id: string; title: string; icon: string; rarity: string; earned_count: number }>)
    .filter((r) => r.badge_id)
    .sort((a, b) => b.earned_count - a.earned_count);

  return {
    overview: (overview.data ?? null) as StatsOverview | null,
    sources: sourcesArr,
    daily: dailyArr,
    majors: majorsArr,
    classLevels: classArr,
    badgeRarity: rarityArr,
    topBadges: topBadgeArr,
  };
}

export async function getStreakDistribution(): Promise<Array<{ bucket: string; users: number }>> {
  const sb = await createClient();
  // Count in the database. Selecting every streak_days row silently stops
  // at PostgREST's 1,000-row cap, so the buckets were wrong past that.
  const base = () =>
    sb.from("user_gamification_profiles").select("user_id", { count: "exact", head: true });
  const buckets = [
    { label: "0",     query: base().or("streak_days.lte.0,streak_days.is.null") },
    { label: "1–2",   query: base().gte("streak_days", 1).lte("streak_days", 2) },
    { label: "3–6",   query: base().gte("streak_days", 3).lte("streak_days", 6) },
    { label: "7–13",  query: base().gte("streak_days", 7).lte("streak_days", 13) },
    { label: "14–29", query: base().gte("streak_days", 14).lte("streak_days", 29) },
    { label: "30+",   query: base().gte("streak_days", 30) },
  ];
  const counts = await Promise.all(buckets.map(async (b) => {
    const { count } = await b.query;
    return { bucket: b.label, users: count ?? 0 };
  }));
  return counts;
}

export async function getTopStreaks(limit = 5): Promise<{
  leaders: Array<{ user_id: string; streak_days: number; display_name: string | null; level: number; major: string | null; }>;
  /** Everyone tied at the longest current streak, not just the rows we list. */
  tiedAtTop: number;
}> {
  const sb = await createClient();
  const { data: tops } = await sb
    .from("user_gamification_profiles")
    .select("user_id, streak_days, level")
    .order("streak_days", { ascending: false })
    .limit(limit);
  const rows = tops ?? [];
  if (rows.length === 0) return { leaders: [], tiedAtTop: 0 };
  const ids = rows.map((r) => r.user_id);
  const topDays = rows[0].streak_days;
  const [{ data: profiles }, { count: tied }] = await Promise.all([
    sb.from("user_profiles")
      .select("id, display_name, full_name, major_code")
      .in("id", ids),
    topDays > 0
      ? sb.from("user_gamification_profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("streak_days", topDays)
      : Promise.resolve({ count: 0 }),
  ]);
  const pMap = new Map(profiles?.map((p) => [p.id, p]));
  return {
    tiedAtTop: tied ?? 0,
    leaders: rows.map((r) => {
      const p = pMap.get(r.user_id);
      return {
        user_id: r.user_id,
        streak_days: r.streak_days,
        display_name: p?.display_name ?? p?.full_name ?? null,
        level: r.level ?? 1,
        major: p?.major_code ?? null,
      };
    }),
  };
}

export async function getTopStreak() {
  const sb = await createClient();
  const { data } = await sb
    .from("user_gamification_profiles")
    .select("streak_days")
    .order("streak_days", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.streak_days ?? 0;
}
