/**
 * UCSB Fall '25 enrollment, from the UCSB Office of Budget & Planning.
 *
 * Still the most recent PUBLISHED census: official figures land a few weeks
 * after each fall census date, so Fall '26 is not available until well after
 * classes start on 24 September. The /stats hero names the census for that
 * reason — it is a real published number, just not this term's.
 * Update when Fall '26 publishes.
 */
export const UCSB_UNDERGRAD_ENROLLMENT = 23196;

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

