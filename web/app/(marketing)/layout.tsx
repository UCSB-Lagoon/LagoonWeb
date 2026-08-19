import type { Metadata } from "next";
import Script from "next/script";
import { SiteAnalytics } from "@/components/site-analytics";
import { AnnounceBar } from "@/components/marketing/announce-bar";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

/**
 * Marketing + guides shell — the 29 SEO guides, /guides, /company, the
 * homepage. Reports to the MARKETING GA4 stream (G-2F8CTN4DNP). Uses a
 * MARKETING-specific header/footer (its own nav); the app's
 * Navbar/Footer are not used here. Dark mode is class-based (.dark on
 * <html>, set by the boot script in the root layout) and toggleable from
 * the header.
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
      {/* The marketing design system. Still a public/ asset because the
          not-yet-ported static pages also link it; React 19 hoists this
          <link> into <head>. */}
      <link rel="stylesheet" href="/site.css" precedence="default" />
      <a className="skip-link" href="#content">Skip to content</a>
      <AnnounceBar />
      <MarketingHeader />
      <main className="flex-1" id="content">{children}</main>
      <MarketingFooter />
      <SiteAnalytics gaId="G-2F8CTN4DNP" />
      <Script src="/lagoon-cta.js" strategy="afterInteractive" />
    </>
  );
}
