/**
 * Where to send someone after sign-in.
 *
 * The login page puts `next` in the magic link's redirect, and also in this
 * cookie — because when Supabase doesn't recognise the redirect URL it falls
 * back to the bare Site URL and drops the path, `next` included. The
 * middleware reads the cookie in that case (see lib/supabase/middleware.ts).
 */
export const NEXT_COOKIE = "lagoon_next";

/** Only same-site paths: "/admin" yes, "//evil.com" and "https://…" no. */
export function safeNext(raw: string | null | undefined, fallback = "/me"): string {
  if (!raw) return fallback;
  let path = raw;
  try { path = decodeURIComponent(raw); } catch { return fallback; }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
