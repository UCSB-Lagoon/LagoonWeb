import type { MetadataRoute } from "next";

const BASE = "https://lagoonucsb.com";

// Hand-crafted static marketing pages served from public/marketing/.
// Keep in sync with the MARKETING_SLUGS array in next.config.ts.
const MARKETING_SLUGS = [
  "best-apps-for-ucsb-students",
  "best-dorms-at-ucsb",
  "best-study-spots-at-ucsb",
  "company",
  "guides",
  "how-lagoon-dining-works",
  "how-lagoon-schedule-works",
  "how-to-choose-classes-at-ucsb",
  "how-to-meet-people-at-ucsb",
  "how-to-plan-your-ucsb-schedule",
  "how-to-use-gold-at-ucsb",
  "isla-vista-guide-for-students",
  "ucsb-campus-events-guide",
  "ucsb-dining-menu",
  "ucsb-dorm-faq",
  "ucsb-finals-week-guide",
  "ucsb-first-week-guide",
  "ucsb-freshman-faq",
  "ucsb-ge-requirements-guide",
  "ucsb-grade-distributions-guide",
  "ucsb-meal-plan-guide",
  "ucsb-move-in-checklist",
  "ucsb-orientation-checklist",
  "ucsb-registration-guide",
  "ucsb-transfer-student-guide",
  "what-to-bring-to-ucsb-dorm",
  "what-to-do-between-classes-at-ucsb",
];

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
    { path: "/login",       priority: 0.3,  change: "yearly"  },
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
