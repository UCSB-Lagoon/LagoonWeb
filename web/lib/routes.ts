/**
 * Where the route-group boundary actually is, in one place.
 *
 * The app renders two GA4 streams — marketing → G-2F8CTN4DNP,
 * app → G-5HY7LBXP8G — and they must never both be live in the same
 * document. See components/site-analytics.tsx for why, and `isAppPath`
 * below for the rule the nav uses to keep them apart.
 *
 * `(marketing)` owns a `[slug]` catch-all, so it is the default: anything
 * that is not an app segment is a marketing route. That makes this list
 * the one thing to update when a segment is added under app/(app)/.
 */
const APP_SEGMENTS = new Set([
  "admin",
  "api",
  "auth",
  "captains",
  "challenges",
  "hub",
  "leaderboard",
  "login",
  "map",
  "me",
  "r",
  "stats",
]);

/** True when `pathname` is served by the (app) route group. */
export function isAppPath(pathname: string): boolean {
  return APP_SEGMENTS.has(pathname.split("/")[1] ?? "");
}

/**
 * True when the two paths sit in different route groups, so moving
 * between them has to be a full page load rather than a soft navigation.
 */
export function crossesRouteGroup(from: string, to: string): boolean {
  return isAppPath(from) !== isAppPath(to);
}

/**
 * The campus tools, in the order the sub-nav shows them.
 *
 * Shared so the sub-nav (components/campus-heading.tsx) and the "Campus"
 * highlight in the main nav (components/navbar.tsx) cannot drift apart.
 */
export const CAMPUS_TOOLS = [
  { href: "/hub", label: "Overview" },
  { href: "/stats", label: "By the numbers" },
  { href: "/map", label: "Campus map" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/challenges", label: "Challenges" },
] as const;

/** Campus routes that light up the "Campus" item in the main nav. */
const CAMPUS_ROUTES = [...CAMPUS_TOOLS.map((t) => t.href), "/me"];

/** True for a campus tool or any route nested under one (e.g. /me/settings). */
export function isCampusPath(pathname: string): boolean {
  return CAMPUS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
