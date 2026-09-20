import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI training crawlers — content is not for model training.
      { userAgent: ["GPTBot", "Google-Extended", "CCBot", "Bytespider", "omgili", "omgilibot"], disallow: "/" },

      // Allow standard search + AI search/retrieval.
      { userAgent: ["Googlebot", "Bingbot", "facebookexternalhit", "Twitterbot"], allow: "/" },
      { userAgent: ["ClaudeBot", "anthropic-ai", "PerplexityBot", "YouBot"], allow: "/" },

      // Default: allow public pages, block authenticated/private surfaces.
      {
        userAgent: "*",
        allow: "/",
        // /lab is the design lab. It already 404s in production and carries
        // noindex, and app/sitemap.ts is an allowlist that omits it — this is
        // the third guard, not the only one.
        disallow: ["/api/", "/auth/", "/me", "/login", "/lab"],
      },
    ],
    sitemap: "https://lagoonucsb.com/sitemap.xml",
    host: "https://lagoonucsb.com",
  };
}
