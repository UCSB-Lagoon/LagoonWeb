import type { Metadata, Viewport } from "next";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export const viewport: Viewport = { themeColor: "#F08A3C" };

/**
 * Web fallback for the app's most-shared link: the invite sheet and
 * classmate shares send https://lagoonucsb.com/schedule. Recipients WITH
 * the app open it directly (universal links via the AASA); everyone else
 * lands here. noindex: thin CTA page, the homepage is the canonical pitch.
 */
export const metadata: Metadata = {
  title: { absolute: "See who's in your UCSB classes — Lagoon" },
  description:
    "Import your GOLD schedule in about 30 seconds and Lagoon shows you which friends — and how many Gauchos — share every class.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://lagoonucsb.com/schedule" },
  openGraph: {
    type: "website",
    siteName: "Lagoon",
    title: "See who's in your UCSB classes",
    description:
      "Import your GOLD schedule in ~30 seconds and see which friends share your classes. Free, built at UCSB.",
    url: "https://lagoonucsb.com/schedule",
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
    title: "See who's in your UCSB classes",
    description:
      "Import your GOLD schedule in ~30 seconds and see which friends share your classes. Free, built at UCSB.",
    images: [
      { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
    ],
  },
};

export default function SchedulePage() {
  return (
    <section id="hero" className="go-hero">
      <div className="go-inner">
        <div className="hero-chip">
          <div className="chip-dot"></div>
          Shared from Lagoon
        </div>
        <h1>
          See who&apos;s in
          <br />
          <em>your classes.</em>
        </h1>
        <p className="hero-desc go-desc">
          Import your GOLD schedule in about 30 seconds — Lagoon shows you
          which friends share every lecture, plus a beautiful Today view and
          widgets.
        </p>
        <div className="hero-btns go-btns">
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="share-schedule"
            className="btn-primary go-cta"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6 6 6-6"/><path d="M3 20h18"/></svg>
            Download Lagoon free
          </a>
        </div>
        <p className="go-meta">
          iPhone · UCSB students only · <a href="/">explore Lagoon →</a>
        </p>
      </div>
    </section>
  );
}
