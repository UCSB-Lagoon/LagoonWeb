import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI training crawlers — content is not for model training.
      { userAgent: ["GPTBot", "Google-Extended", "CCBot", "Bytespider", "omgili", "omgilibot"], disallow: "/" },

      // Allow standard search + AI search/retrieval.
      // Search and retrieval crawlers use the default public-page rules.
      // Specific allow-all groups would override the exclusions below.

      // Default: allow public pages, block authenticated/private surfaces.
      {
        userAgent: "*",
        allow: "/",
        // /lab is the design lab. It already 404s in production and carries
        // noindex, and app/sitemap.ts is an allowlist that omits it — this is
        // the third guard, not the only one.
        disallow: ["/api/", "/auth/", "/admin", "/me", "/login", "/lab"],
      },
    ],
    sitemap: ["https://www.lagoonucsb.com/sitemap.xml", "https://www.lagoonucsb.com/courses/sitemap.xml"],
    host: "https://www.lagoonucsb.com",
  };
}
