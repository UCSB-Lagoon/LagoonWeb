import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";
const COOKIE_NAME = "lagoon_ref";
const SIXTY_DAYS = 60 * 60 * 24 * 60;

const BOT_RE = /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|twitterbot|whatsapp|linkedin|pinterest|telegram|snapchat|imessage|applebot/i;

const sanitizeCode = (raw: string) =>
  (raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);

/**
 * Referral links get shared in iMessage / Instagram DMs, so the unfurl is
 * the first impression. Link-preview crawlers get this metadata (they're
 * served the landing page below instead of the App Store redirect).
 */
export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> }
): Promise<Metadata> {
  const { code: raw } = await params;
  const code = sanitizeCode(raw);
  const title = "You're invited to Lagoon — the UCSB campus app";
  const description =
    "Your GOLD schedule, beautiful in 30 seconds — plus who's in your classes, live dining menus, and a live campus map. Free, built at UCSB.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `https://lagoonucsb.com/r/${code}` },
    openGraph: {
      type: "website",
      siteName: "Lagoon",
      title,
      description,
      url: `https://lagoonucsb.com/r/${code}`,
      images: [
        {
          url: "https://lagoonucsb.com/og-card.png",
          type: "image/png",
          width: 1200,
          height: 630,
          alt: "Lagoon — the UCSB campus app",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
      ],
    },
  };
}

/**
 * /r/[code] — referral attribution redirect for the UCSB captain program.
 *
 * Server-side flow:
 *   1. Sanitize and persist the code as a cookie (60-day window)
 *   2. If the request is a bot/link-preview crawler or comes with
 *      `?noredirect=1`, render a landing page — crawlers must see HTML +
 *      OG tags (not the App Store redirect) for shared links to unfurl
 *      as a designed Lagoon card in iMessage/Instagram/Discord
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
  const code = sanitizeCode(raw);

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

  // Detect link-preview crawlers up front: they get the landing page (so
  // shared links unfurl with our OG card) instead of the App Store 302.
  let isBot = false;
  try {
    const h = await headers();
    isBot = BOT_RE.test(h.get("user-agent") || "");
  } catch {
    /* headers() unavailable → treat as a normal visitor */
  }

  // Log the click (best-effort, never blocks the redirect)
  try {
    const h = await headers();
    const ua = h.get("user-agent") || null;
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const country = h.get("x-vercel-ip-country") || null;
    const supa = await createClient();
    // Cast: Insert typing requires the shared client to carry the PostgrestVersion type param.
    await supa.from("referral_clicks").insert({
      referral_code: code,
      user_agent: ua,
      ip,
      country,
      is_bot: isBot,
      page_path: `/r/${code}`,
    } as unknown as never);
  } catch (e) {
    console.warn("[r/code] click log failed", e);
  }

  // SEO / preview surface — for link-preview crawlers and explicit requests
  if (noredirect === "1" || isBot) {
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
