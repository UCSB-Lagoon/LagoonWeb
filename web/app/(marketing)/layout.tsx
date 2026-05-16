import type { Metadata } from "next";
import Script from "next/script";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SiteAnalytics } from "@/components/site-analytics";
import { AnnounceBar } from "@/components/marketing/announce-bar";

/**
 * Marketing + guides shell — the 25 SEO guides, /guides, /company, and
 * (Phase 3) the homepage. Reports to the MARKETING GA4 stream
 * (G-2F8CTN4DNP) to preserve that stream's history. Same shared
 * Navbar/Footer as the app — post-migration this is one product.
 *
 * Default metadata mirrors what every static guide carried (author,
 * robots, Apple smart-banner). Per-page title/description/canonical/
 * OG/Twitter are set in (marketing)/[slug]/page.tsx. Deliberately NO
 * keywords / appleWebApp / og:site_name — the static pages had none and
 * keeping them off avoids SEO drift vs. the goldens.
 */
export const metadata: Metadata = {
  authors: [{ name: "Lagoon" }],
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/logo.svg", type: "image/svg+xml" }] },
  other: {
    "apple-itunes-app": "app-id=6760681142, app-argument=https://lagoonucsb.com/",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnounceBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <SiteAnalytics gaId="G-2F8CTN4DNP" />
      <Script src="/lagoon-cta.js" strategy="afterInteractive" />
    </>
  );
}
