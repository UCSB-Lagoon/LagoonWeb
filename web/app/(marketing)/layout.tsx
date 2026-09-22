import type { Metadata } from "next";
/**
 * The marketing design system. Imported here rather than linked from public/,
 * so the bundler fingerprints it and it is only fetched on marketing routes.
 *
 * It used to be `<link rel="stylesheet" href="/site.css" precedence="default">`
 * against a `next/no-css-tags` disable, justified by static pages that also
 * linked it — those are gone, every marketing URL is a real route now, and
 * nothing references the literal `/site.css` URL any more.
 *
 * Two things this import must NOT change, both load-bearing:
 *
 *  - It stays on THIS layout, not globals.css. An `@import` from globals.css
 *    would pin the layer order in one stylesheet, but globals.css loads on
 *    every route, so all ~3000 lines would ship to the app shell that has no
 *    use for them.
 *  - The file's `@layer marketing` wrapper still decides the cascade. Its
 *    order is fixed by the `@layer` statement at the top of globals.css, which
 *    the root layout loads first. That is what keeps site.css below Tailwind's
 *    utilities — and it has to keep working after a soft navigation OUT of
 *    this group, because the stylesheet is not removed when the layout
 *    unmounts. Bundled or linked, it lingers; the layer is what makes that
 *    harmless.
 */
import "./site.css";
import "./editorial.css";
import { SiteAnalytics } from "@/components/site-analytics";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/**
 * Marketing + guides shell — the 29 SEO guides, /guides, /company, the
 * homepage. Reports to the MARKETING GA4 stream (G-2F8CTN4DNP).
 *
 * Header and footer are the SAME components the app shell renders. They
 * were separate until the campus redesign, then became one-line
 * re-exports of Navbar/Footer that only obscured where the markup lived;
 * the indirection is gone. Links that leave this group are full page
 * loads (components/group-link.tsx) so only one GA4 stream is ever live
 * in a document.
 *
 * Dark mode is class-based (.dark on <html>, set by the boot script in
 * the root layout) and toggleable from the header.
 *
 * Default metadata mirrors what every static guide carried (author,
 * robots, Apple smart-banner). Per-page title/description/canonical/
 * OG/Twitter are set in (marketing)/[slug]/page.tsx. Deliberately NO
 * keywords / appleWebApp / og:site_name — the static pages had none and
 * keeping them off avoids SEO drift vs. the goldens.
 */
export const metadata: Metadata = {
  // `author` meta is per-page (some originals had it, some didn't) — set
  // in (marketing)/[slug] from frontmatter, not globally here.
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/logo.svg", type: "image/svg+xml" }] },
  other: {
    "apple-itunes-app": "app-id=6760681142, app-argument=https://lagoonucsb.com/",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <Navbar />
      <main className="flex-1" id="content">{children}</main>
      <Footer />
      <SiteAnalytics gaId="G-2F8CTN4DNP" />
    </>
  );
}
