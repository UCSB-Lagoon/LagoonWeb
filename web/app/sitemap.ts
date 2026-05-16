import type { MetadataRoute } from "next";
import { MARKETING_SLUGS } from "@/lib/marketing-slugs";

const BASE = "https://lagoonucsb.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const interactive: Array<{
    path: string;
    priority: number;
    change: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "/",            priority: 1.0,  change: "daily"   },   // marketing homepage
    { path: "/hub",         priority: 0.9,  change: "daily"   },   // live dashboard
    { path: "/leaderboard", priority: 0.85, change: "daily"   },
    { path: "/challenges",  priority: 0.7,  change: "weekly"  },
    { path: "/stats",       priority: 0.8,  change: "daily"   },
    { path: "/map",         priority: 0.85, change: "weekly"  },
    { path: "/captains",    priority: 0.7,  change: "monthly" },
    // /login and /me are intentionally excluded — robots.ts disallows them,
    // so listing them here would be a contradictory crawl signal.
  ];

  const marketing: Array<{
    path: string;
    priority: number;
    change: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = MARKETING_SLUGS.map((slug) => ({
    path: `/${slug}`,
    priority: 0.7,
    change: "monthly" as const,
  }));

  return [...interactive, ...marketing].map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.change,
    priority: r.priority,
  }));
}
