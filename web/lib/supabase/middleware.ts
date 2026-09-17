import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No credentials, no session to refresh. supabase-js THROWS rather than
  // returning a client when either is missing, and the matcher below covers
  // every non-static path — so one absent env var took down every request,
  // including the marketing pages that never touch the database.
  //
  // That is not hypothetical: it is why `seo.yml` had failed on every run
  // since 9 August and why the contrast job failed the first time it ran.
  // Both start a production server with no env, so `wait-on` waited on a
  // server that 500'd everything.
  //
  // Gated on the env itself, never on NODE_ENV: if these are unset in
  // production the app has no auth at all, so there is no gate to bypass
  // here — pages do their own `getUser()` check and redirect, and
  // lib/supabase/server.ts would throw before any of them rendered.
  if (!url || !key) return response;

  const supabase = createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}
