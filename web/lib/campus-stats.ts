// Shape of `public_campus_stats()` (iOS repo, Supabase migration 085). One
// anon-callable aggregate: anything that could point at a person is floored
// (3+ students per course/building, 20+ with a schedule for the facts) and
// internal accounts are excluded before anything is counted.
//
// Types and pure helpers only — client charts import this file. The fetch is
// getCampusStats() in lib/queries.ts.

export type Weekday = "M" | "T" | "W" | "R" | "F";

export type CampusStats = {
  generated_at: string;
  totals: {
    gauchos: number;
    active_today: number;
    active_7d: number;
    active_30d: number;
    with_schedule: number;
    class_seats: number;
    courses: number;
    friendships: number;
  };
  growth: { day: string; new: number; total: number }[];
  daily_active: { day: string; active: number }[];
  /** dow 0 = Sunday. `n` is people-days: one person on two Mondays counts twice. */
  heartbeat: { dow: number; hour: number; n: number }[];
  /** Students sitting in class, every 15 minutes 7:00–22:00. */
  class_clock: { day: Weekday; minute: number; n: number }[];
  facts: {
    students: number;
    friday_free_pct: number;
    has_8am_pct: number;
    has_evening_pct: number;
    avg_courses: number;
    avg_hours_in_class: number;
    top_start_minute: number;
    busiest_day: Weekday;
    share_a_class_pct: number;
  } | null;
  top_courses: { course: string; title: string | null; students: number }[];
  top_buildings: { building: string; students: number; meetings: number; lat: number | null; lng: number | null }[];
  majors: { major: string; name: string | null; students: number }[];
  years: { year: string; students: number }[];
};

export const WEEKDAY_NAME: Record<Weekday, string> = {
  M: "Monday", T: "Tuesday", W: "Wednesday", R: "Thursday", F: "Friday",
};

/** 660 → "11:00 AM". Minutes after midnight, campus wall-clock. */
export function clockLabel(minute: number, compact = false) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? (compact ? "a" : " AM") : (compact ? "p" : " PM");
  if (compact && m === 0) return `${h12}${suffix}`;
  return `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

/** "Economics and Accounting B.A." → { name: "Economics and Accounting", degree: "B.A." } */
export function splitMajor(name: string | null, code: string) {
  if (!name) {
    const [dept, deg] = code.split("_");
    return { name: dept, degree: deg ?? "" };
  }
  const m = name.match(/^(.*?)\s+(B\.[AS]\.|M\.[AS]\.|Ph\.D\.)$/);
  return m ? { name: m[1], degree: m[2] } : { name, degree: "" };
}

/** "2026-09-24" → "Sep 24". Pinned to UTC so server and client agree. */
export function shortDay(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

/** Whole days between two YYYY-MM-DD dates. */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/** A round axis ceiling and step: 213 → { max: 250, step: 50 }. */
export function niceScale(value: number, ticks = 4) {
  const raw = Math.max(1, value) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? 10 * mag;
  return { max: Math.ceil(Math.max(1, value) / step) * step, step };
}
