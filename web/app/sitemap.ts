import type { MetadataRoute } from "next";

const BASE = "https://app.lagoonucsb.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; change: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/",            priority: 1.0,  change: "daily"   },
    { path: "/leaderboard", priority: 0.9,  change: "daily"   },
    { path: "/challenges",  priority: 0.8,  change: "weekly"  },
    { path: "/stats",       priority: 0.85, change: "daily"   },
    { path: "/map",         priority: 0.9,  change: "weekly"  },
    { path: "/login",       priority: 0.4,  change: "yearly"  },
  ];
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.change,
    priority: r.priority,
  }));
}
