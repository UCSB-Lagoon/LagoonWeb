import type { Metadata, Viewport } from "next";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export const viewport: Viewport = { themeColor: "#F08A3C" };

/**
 * Web fallback for Gaucho Wrapped shares (https://lagoonucsb.com/wrapped).
 * App-havers open their recap directly via universal links; everyone else
 * lands here. noindex: thin CTA page.
 */
export const metadata: Metadata = {
  title: { absolute: "Gaucho Wrapped — your quarter, in review | Lagoon" },
  description:
    "Lagoon turns your UCSB quarter into a shareable recap — your classes, streaks, badges, and the Gauchos you shared them with.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://lagoonucsb.com/wrapped" },
  openGraph: {
    type: "website",
    siteName: "Lagoon",
    title: "Gaucho Wrapped — your quarter, in review",
    description:
      "Your classes, streaks, badges, and the Gauchos you shared them with. Free, built at UCSB.",
    url: "https://lagoonucsb.com/wrapped",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Lagoon — the UCSB campus app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gaucho Wrapped — your quarter, in review",
    description:
      "Your classes, streaks, badges, and the Gauchos you shared them with. Free, built at UCSB.",
    images: [
      { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
    ],
  },
};

export default function WrappedPage() {
  return (
    <section id="hero" className="go-hero">
      <div className="go-inner">
        <div className="hero-chip">
          <div className="chip-dot"></div>
          Gaucho Wrapped
        </div>
        <h1>
          Your quarter,
          <br />
          <em>in review.</em>
        </h1>
        <p className="hero-desc go-desc">
          At the end of every quarter, Lagoon wraps your classes, streaks,
          badges, and the Gauchos you shared them with into a recap worth
          posting.
        </p>
        <div className="hero-btns go-btns">
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="share-wrapped"
            className="btn-primary go-cta"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6 6 6-6"/><path d="M3 20h18"/></svg>
            Download Lagoon free
          </a>
        </div>
        <p className="go-meta">
          Already have Lagoon? This link opens your Wrapped automatically.
        </p>
      </div>
    </section>
  );
}
