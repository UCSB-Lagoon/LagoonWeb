/**
 * Approx UCSB Fall '25 enrollment, sourced from UCSB Office of Budget &
 * Planning (rounded). Update when new figures publish.
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
