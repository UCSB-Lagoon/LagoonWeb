import type { MetadataRoute } from "next";

/**
 * Private surfaces every crawler stays out of.
 * /lab is the design lab. It already 404s in production and carries noindex,
 * and app/sitemap.ts is an allowlist that omits it — this is the third
 * guard, not the only one.
 */
const PRIVATE = ["/api/", "/auth/", "/admin", "/me", "/login", "/lab"];

/**
 * AI search, answer and training crawlers, named so the policy is explicit.
 * They were partly blocked until 2026-11 (GPTBot, Google-Extended and CCBot,
 * "not for model training"). The site is public marketing for a free app,
 * and being in what ChatGPT, Gemini and Claude know and cite is the point,
 * so they get the same access as everyone else (SEO_AI_PLAN.md, item 5).
 * Google documents that Google-Extended "does not impact a site's inclusion
 * in Google Search nor is it used as a ranking signal"; it controls Gemini
 * training and grounding. Googlebot falls under `*`.
 * https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
 *
 * A named group REPLACES the `*` group for that crawler, so each one must
 * repeat the PRIVATE disallows.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "Claude-SearchBot", "Claude-User", "ClaudeBot",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },

      // Bulk scrapers with no search or answer product behind them.
      { userAgent: ["Bytespider", "omgili", "omgilibot"], disallow: "/" },

      // Default: allow public pages, block authenticated/private surfaces.
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: ["https://www.lagoonucsb.com/sitemap.xml", "https://www.lagoonucsb.com/courses/sitemap.xml"],
    host: "https://www.lagoonucsb.com",
  };
}
