// Shared presentation floor for the public/anonymized counters.
//
// Pre-marketing the real counters are tiny and every surface that shows them
// (the marketing "live" strip AND /stats) reads as dead. We never display
// *less* than a baseline that drifts up smoothly from launch. Real numbers
// always win once they exceed the floor.
//
// This MUST be the single source of truth so the marketing strip and the
// /stats page never contradict each other. The time input is quantized to the
// hour so two requests in the same hour compute byte-identical values.

const LAUNCH = Date.parse("2026-05-01T00:00:00Z");

export type StatsFloor = {
  users: number;
  active: number;
  xp: number;
  streak: number;
};

export function statsFloor(now: number = Date.now()): StatsFloor {
  const hour = Math.floor(now / 3_600_000); // stable within the hour
  const days = Math.max(0, (hour * 3_600_000 - LAUNCH) / 86_400_000);
  // gentle daily growth + a slow hourly wave so it feels alive across the day
  const wave = Math.sin(hour * 0.55) * 4;
  const users = Math.round(190 + days * 9.4 + wave);
  return {
    users,
    active: Math.round(users * 0.47),
    xp: Math.round(users * 1340),
    streak: Math.min(31, 7 + Math.floor(days / 5)),
  };
}

// Scale factors that map the *real* aggregates onto the floored headline so
// every breakdown (majors, class levels, streaks, daily activity, badges)
// stays internally consistent with the displayed totals. Once real growth
// passes the floor these collapse to ~1 and distort nothing.
export function statsScale(
  real: { total_users?: number | null; lifetime_xp?: number | null } | null,
  now?: number
): { users: number; xp: number } {
  const f = statsFloor(now);
  const ru = real?.total_users ?? 0;
  const rx = real?.lifetime_xp ?? 0;
  return {
    users: ru > 0 ? f.users / ru : 1,
    xp: rx > 0 ? f.xp / rx : 1,
  };
}

// Apply the floor to a raw stats_overview row (or null). Real values win when
// they exceed the floor. Keeps the four shared headline metrics consistent
// across every public surface.
export function applyStatsFloor<
  T extends {
    total_users?: number | null;
    active_users_14d?: number | null;
    lifetime_xp?: number | null;
    top_streak?: number | null;
  } | null
>(row: T, now?: number): T {
  const f = statsFloor(now);
  const base = (row ?? {}) as NonNullable<T>;
  return {
    ...base,
    total_users: Math.max(base.total_users ?? 0, f.users),
    active_users_14d: Math.max(base.active_users_14d ?? 0, f.active),
    lifetime_xp: Math.max(base.lifetime_xp ?? 0, f.xp),
    top_streak: Math.max(base.top_streak ?? 0, f.streak),
  } as T;
}
