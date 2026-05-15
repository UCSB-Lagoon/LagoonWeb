import type { NextConfig } from "next";

/**
 * Marketing slugs that live as hand-crafted static HTML inside public/marketing/.
 * Each one is served from public/marketing/<slug>.html via a Next.js rewrite so
 * the URL stays clean (e.g. /ucsb-dining-menu instead of /marketing/ucsb-dining-menu.html).
 */
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

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lagoonucsb.com" },
    ],
  },
  async rewrites() {
    return [
      // Root → marketing homepage (hand-crafted HTML). The Next.js dashboard
      // moved to /hub.
      { source: "/", destination: "/marketing/home.html" },
      // Each marketing slug → its static HTML in public/marketing/.
      ...MARKETING_SLUGS.map((slug) => ({
        source: `/${slug}`,
        destination: `/marketing/${slug}.html`,
      })),
    ];
  },
};

export default config;
