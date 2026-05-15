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
        disallow: ["/api/", "/auth/", "/me", "/login"],
      },
    ],
    sitemap: "https://lagoonucsb.com/sitemap.xml",
    host: "https://lagoonucsb.com",
  };
}
