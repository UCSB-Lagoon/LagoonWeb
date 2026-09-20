import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * The design lab — a place to try whole visual concepts against the real
 * components and the real database, without any of it being able to reach
 * a visitor.
 *
 * Why a route group and not a second repo: a concept is only worth anything
 * if it renders the actual data (142 Gauchos, not 12,400 lorem ones) through
 * the actual query layer, and if a direction that works can be ported back by
 * moving a file rather than by re-deriving the brand. A separate repo starts
 * with none of `scripts/check-brand.mjs`, `e2e/contrast.spec.ts` or the visual
 * baselines, which is the machinery four repaint passes paid for.
 *
 * Three independent guards, because "temporary" routes outlive their reason:
 *
 *  1. It 404s in production. Not hidden, not unlinked — `notFound()`. Set
 *     LAGOON_ENABLE_LAB=1 to override on a production deploy, deliberately.
 *  2. `robots: noindex, nofollow`, and app/robots.ts disallows /lab.
 *  3. app/sitemap.ts is an explicit allowlist, so /lab cannot appear in it
 *     by omission or accident.
 *
 * This group deliberately does NOT load the marketing stylesheet or the app
 * navbar. A concept that has to live inside the current chrome cannot propose
 * replacing it.
 */
export const metadata: Metadata = {
  title: { default: "Design lab", template: "%s · Lagoon lab" },
  robots: { index: false, follow: false, nocache: true },
};

const LAB_ENABLED =
  process.env.LAGOON_ENABLE_LAB === "1" || process.env.VERCEL_ENV !== "production";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (!LAB_ENABLED) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-ink-900">
      {/* Deliberately loud and unstyleable by the concepts below it. If you
          ever can't tell whether you're looking at the lab or the site, the
          lab has failed at its one safety property. */}
      <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-ink-900 bg-ink-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-50">
        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-on-accent">Lab</span>
        <span className="text-cream-50/80">Not the live site · never indexed · 404s in production</span>
        <Link href="/lab" className="ml-auto underline underline-offset-2 hover:text-gold-500">
          All concepts
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
