import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NEXT_COOKIE, safeNext } from "@/lib/auth-next";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // A failed exchange used to redirect to /me anyway, which bounced to
  // /login with no explanation. Say what happened instead.
  let failed = !code;
  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    failed = !!error;
  }
  const to = failed
    ? new URL(`/login?error=exchange_failed&next=${encodeURIComponent(next)}`, url.origin)
    : new URL(next, url.origin);
  const res = NextResponse.redirect(to);
  if (!failed) res.cookies.delete(NEXT_COOKIE);
  return res;
}
