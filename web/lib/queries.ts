import { createClient } from "@/lib/supabase/server";
import { weekStart } from "@/lib/utils";
import type { LeaderRow } from "@/components/gamification/leaderboard-table";

export async function getActivityFeed(limit = 20) {
  const sb = await createClient();
  const { data } = await sb
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
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

  const ids = lb.map((r) => r.user_id);
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

  return lb.map((r) => {
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

export async function getVibeScore(): Promise<number> {
  const sb = await createClient();
  const since1h  = new Date(Date.now() - 3600_000).toISOString();
  const since24h = new Date(Date.now() - 86_400_000).toISOString();
  const [{ count: hour }, { count: day }] = await Promise.all([
    sb.from("user_xp_events").select("*", { count: "exact", head: true }).gte("created_at", since1h),
    sb.from("user_xp_events").select("*", { count: "exact", head: true }).gte("created_at", since24h),
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
  return { user, profile, stats, badges: badges ?? [], weekXp: weekXp ?? [] };
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
  return {
    xpThisWeek: (lb ?? []).reduce((s, r) => s + (r.xp ?? 0), 0),
    weekEvents: feed24h?.length ?? 0,    // last-24h actions; closest public proxy
    activeUsers: activeUsers ?? 0,
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
