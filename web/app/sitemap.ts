import type { MetadataRoute } from "next";
import { MARKETING_SLUGS } from "@/lib/marketing-slugs";
import { getGuideIndex } from "@/lib/guide-index";

const BASE = "https://lagoonucsb.com";

type Entry = {
  path: string;
  priority: number;
  change: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified?: Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const interactive: Entry[] = [
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

  // Guides carry a real `dateModified` in their frontmatter. Using it
  // beats stamping every URL with the build time: an unchanged guide keeps
  // an unchanged lastModified, which is the signal crawlers actually act on.
  const guides = await getGuideIndex();
  const guideDates = new Map(
    guides.map((g) => [g.slug, g.dateModified ? new Date(g.dateModified) : undefined])
  );

  const marketing: Entry[] = MARKETING_SLUGS.map((slug) => ({
    path: `/${slug}`,
    priority: 0.7,
    change: "monthly" as const,
    lastModified: guideDates.get(slug as (typeof guides)[number]["slug"]),
  }));

  return [...interactive, ...marketing].map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: r.lastModified ?? now,
    changeFrequency: r.change,
    priority: r.priority,
  }));
}
