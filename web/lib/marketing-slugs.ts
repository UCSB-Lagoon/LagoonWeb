/**
 * Single source of truth for the hand-crafted marketing pages.
 *
 * Historically this list was copy-pasted in next.config.ts AND sitemap.ts.
 * It now lives here; both import it. Used by the SEO snapshot harness and
 * (after the JSX migration) by the (marketing) route's generateStaticParams.
 *
 * "/" (the homepage) is tracked separately as `MARKETING_HOME_PATH`.
 */
export const MARKETING_HOME_PATH = "/";

export const MARKETING_SLUGS = [
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
] as const;

export type MarketingSlug = (typeof MARKETING_SLUGS)[number];

/** Every marketing URL path, including the homepage. */
export const ALL_MARKETING_PATHS: string[] = [
  MARKETING_HOME_PATH,
  ...MARKETING_SLUGS.map((s) => `/${s}`),
];
