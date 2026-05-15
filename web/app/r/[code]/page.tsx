import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";
const COOKIE_NAME = "lagoon_ref";
const SIXTY_DAYS = 60 * 60 * 24 * 60;

/**
 * /r/[code] — referral attribution redirect for the UCSB captain program.
 *
 * Server-side flow:
 *   1. Sanitize and persist the code as a cookie (60-day window)
 *   2. If the request is a bot or comes with `?noredirect=1`, render a landing page
 *      so search engines can index the captain credit
 *   3. Otherwise 302 → App Store
 *
 * The client-side script in app/layout.tsx also persists the code as a fallback,
 * so the cookie is set even if a CDN serves a cached redirect.
 */
export default async function ReferralRedirect(
  { params, searchParams }: {
    params: Promise<{ code: string }>;
    searchParams: Promise<{ noredirect?: string }>;
  }
) {
  const { code: raw } = await params;
  const { noredirect } = await searchParams;
  const code = (raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);

  if (!code) redirect("/");

  // Persist attribution
  try {
    const jar = await cookies();
    jar.set(COOKIE_NAME, code, {
      path: "/",
      maxAge: SIXTY_DAYS,
      sameSite: "lax",
      httpOnly: false,
    });
  } catch {
    /* cookies() not always available — client fallback handles it */
  }

  // SEO / preview surface — only renders when explicitly requested
  if (noredirect === "1") {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <span className="pill mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Captain referral
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
          You were invited by <span className="italic-accent">{code}</span>.
        </h1>
        <p className="mt-5 text-lg text-ink-500">
          Download Lagoon and you&apos;ll be counted toward their captain credit.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={APP_STORE} rel="noreferrer"
            data-lagoon-cta={`referral-${code}`}
            className="btn-primary">Download Lagoon free</a>
          <Link href="/" className="btn-secondary">Explore Lagoon</Link>
        </div>
      </div>
    );
  }

  redirect(APP_STORE);
}

// Cache hint — these are personalized and short-lived, but a 5-min edge cache
// is fine for the cookie set + redirect
export const dynamic = "force-dynamic";
