/**
 * Marketing route slugs.
 *
 * - MARKETING_SLUGS: every marketing path (drives sitemap.ts). "/" (the
 *   homepage) is its own route and tracked separately by the sitemap.
 * - MIGRATED_GUIDE_SLUGS: the 25 MDX guide bodies under content/guides/;
 *   used by app/(marketing)/[slug] generateStaticParams. (/guides and
 *   /company are NOT here — they have their own dedicated routes.)
 *
 * The migration is complete: there is no static-HTML fallback anymore,
 * so the old PENDING/HOME_MIGRATED gating is gone.
 */
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
  "ucsb-dining-commons-hours",
  "ucsb-dining-menu",
  "ucsb-dorm-faq",
  "ucsb-fall-2026-start-date",
  "ucsb-finals-week-guide",
  "ucsb-first-week-guide",
  "ucsb-freshman-faq",
  "ucsb-ge-requirements-guide",
  "ucsb-grade-distributions-guide",
  "ucsb-meal-plan-guide",
  "ucsb-move-in-checklist",
  "ucsb-orientation-checklist",
  "ucsb-pass-times-explained",
  "ucsb-registration-guide",
  "ucsb-transfer-student-guide",
  "what-to-bring-to-ucsb-dorm",
  "what-to-do-between-classes-at-ucsb",
  "whos-in-my-class-ucsb",
] as const;

export type MarketingSlug = (typeof MARKETING_SLUGS)[number];

/** The MDX guide slugs served by app/(marketing)/[slug]. */
export const MIGRATED_GUIDE_SLUGS = [
  "ucsb-dining-menu",
  "best-apps-for-ucsb-students",
  "best-dorms-at-ucsb",
  "best-study-spots-at-ucsb",
  "how-lagoon-dining-works",
  "how-lagoon-schedule-works",
  "how-to-choose-classes-at-ucsb",
  "how-to-meet-people-at-ucsb",
  "how-to-plan-your-ucsb-schedule",
  "how-to-use-gold-at-ucsb",
  "isla-vista-guide-for-students",
  "ucsb-campus-events-guide",
  "ucsb-dining-commons-hours",
  "ucsb-dorm-faq",
  "ucsb-fall-2026-start-date",
  "ucsb-finals-week-guide",
  "ucsb-first-week-guide",
  "ucsb-freshman-faq",
  "ucsb-ge-requirements-guide",
  "ucsb-grade-distributions-guide",
  "ucsb-meal-plan-guide",
  "ucsb-move-in-checklist",
  "ucsb-orientation-checklist",
  "ucsb-pass-times-explained",
  "ucsb-registration-guide",
  "ucsb-transfer-student-guide",
  "what-to-bring-to-ucsb-dorm",
  "what-to-do-between-classes-at-ucsb",
  "whos-in-my-class-ucsb",
] as const;
