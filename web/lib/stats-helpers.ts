/**
 * UCSB Fall '25 enrollment, from the UCSB Office of Budget & Planning.
 *
 * Still the most recent PUBLISHED census: official figures land a few weeks
 * after each fall census date, so Fall '26 is not available until well after
 * classes start on 24 September. The /stats copy says "~" and names the year
 * for that reason — it is a real published number, just not this term's.
 * Update when Fall '26 publishes.
 */
export const UCSB_UNDERGRAD_ENROLLMENT = 23196;
export const UCSB_TOTAL_ENROLLMENT     = 26420;

export const SOURCE_LABEL: Record<string, string> = {
  daily_check_in:   "Daily check-in",
  planner_progress: "Planner progress",
  schedule_add:     "Schedule edit",
  class_vibe:       "Class vibe",
  friend_request:   "Friend request",
  friend_accept:    "Friend accepted",
  referral:         "Referral",
  badge_earned:     "Badge earned",
};

export function prettifySource(s: string) {
  return SOURCE_LABEL[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * UCSB stores majors as `<DEPT>_<DEGREE>` (e.g. `ECONACC_BA`). Make a friendlier
 * label without inventing department names: just split + sentence-case the prefix
 * and uppercase the degree.
 */
export function prettifyMajor(code: string) {
  if (code === "Undeclared") return code;
  const [dept, deg] = code.split("_");
  if (!deg) return code;
  return `${dept} · ${deg}`;
}

/** Normalize "Third Year"/"Junior" style noise into a single bucket. */
export function normalizeClassLevel(raw: string) {
  const s = raw.toLowerCase();
  if (/(first|fresh)/.test(s))  return "Freshman";
  if (/(second|soph)/.test(s))  return "Sophomore";
  if (/(third|junior)/.test(s)) return "Junior";
  if (/(fourth|senior)/.test(s))return "Senior";
  if (/(fifth|grad|phd)/.test(s)) return "Grad";
  return "Unknown";
}

export function pct(n: number, d: number) {
  if (!d) return 0;
  return (n / d) * 100;
}

/**
 * How often /stats and /api/public/stats may serve a cached response.
 * The underlying views are ordinary SQL — they recompute on every query —
 * so this number is the only delay between a new signup and the page.
 * Next.js requires `export const revalidate` to be a literal; keep those
 * literals equal to this constant.
 */
export const STATS_REVALIDATE_SECONDS = 30;

/** Daily series length. Matches `stats_xp_daily` (now() - 30 days). */
export const STATS_WINDOW_DAYS = 30;

export const STATS_TZ = "America/Los_Angeles";

const RARITY_RANK = ["common", "rare", "epic", "legendary"];

export function rarityRank(rarity: string) {
  const i = RARITY_RANK.indexOf(rarity);
  return i === -1 ? RARITY_RANK.length : i;
}

/** Calendar date in America/Los_Angeles, YYYY-MM-DD. */
export function laDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STATS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Shift a YYYY-MM-DD by whole calendar days. */
export function shiftIsoDate(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The last `n` Pacific calendar dates, ending today, oldest first. */
export function laCalendarDays(n: number, today = laDateString()): string[] {
  const start = shiftIsoDate(today, -(n - 1));
  return Array.from({ length: n }, (_, i) => shiftIsoDate(start, i));
}

/**
 * UTC instant of midnight at the start of `isoDate` in Pacific time.
 * Used as the lower bound when bucketing `created_at` ourselves.
 */
export function laMidnightIso(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12));
  const tz = new Intl.DateTimeFormat("en-US", {
    timeZone: STATS_TZ,
    timeZoneName: "shortOffset",
  }).formatToParts(noon).find((p) => p.type === "timeZoneName")?.value ?? "GMT-8";
  const match = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  let offsetMin = -8 * 60;
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    offsetMin = sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  }
  return new Date(Date.UTC(y, m - 1, d) - offsetMin * 60_000).toISOString();
}

/** Weekday of a YYYY-MM-DD, 0 = Sunday. The string is already a calendar date. */
export function utcWeekday(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Format a YYYY-MM-DD without shifting it into the previous evening.
 * `new Date("2026-09-21")` is UTC midnight, which `toLocaleDateString`
 * renders as Sep 20 in Pacific time. Pin the zone to UTC.
 */
export function formatIsoDate(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const day = iso.slice(0, 10);
  const dt = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export type DailyActivity = {
  day: string;
  event_count: number;
  active_users: number;
  total_xp: number;
};

/**
 * Left-join activity onto a complete calendar. Days with no rows were
 * dropped by the view, and averaging only the days that exist inflates
 * "a typical day" and the weekday chart.
 */
export function fillActivity(rows: DailyActivity[], days: string[]): DailyActivity[] {
  const map = new Map(rows.map((r) => [r.day.slice(0, 10), r]));
  return days.map((day) => {
    const hit = map.get(day);
    return {
      day,
      event_count: hit?.event_count ?? 0,
      active_users: hit?.active_users ?? 0,
      total_xp: hit?.total_xp ?? 0,
    };
  });
}

export function fillCounts(
  rows: Array<{ day: string; count: number }>,
  days: string[],
): Array<{ day: string; count: number }> {
  const map = new Map(rows.map((r) => [r.day.slice(0, 10), r.count]));
  return days.map((day) => ({ day, count: map.get(day) ?? 0 }));
}

/** `offsetFromEnd` 0 is the latest window; 7 is the week before that. */
export function sliceWindow<T>(rows: T[], length: number, offsetFromEnd: number): T[] {
  const end = rows.length - offsetFromEnd;
  return rows.slice(Math.max(0, end - length), Math.max(0, end));
}

export function sumBy<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((sum, row) => sum + pick(row), 0);
}

export type Delta = {
  text: string;
  tone: "up" | "down" | "flat";
  /** Null when the prior window was zero and a percentage would be meaningless. */
  pct: number | null;
};

export function delta(current: number, previous: number): Delta {
  if (current === previous) return { text: "Flat vs prior week", tone: "flat", pct: 0 };
  if (previous === 0) {
    return {
      text: current > 0 ? "None in the prior week" : "Flat vs prior week",
      tone: current > 0 ? "up" : "flat",
      pct: null,
    };
  }
  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.abs(raw) >= 10 ? Math.round(raw) : Math.round(raw * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return {
    text: `${sign}${rounded}% vs prior week`,
    tone: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
    pct: rounded,
  };
}
