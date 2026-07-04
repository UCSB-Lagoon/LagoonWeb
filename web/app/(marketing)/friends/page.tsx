import type { Metadata, Viewport } from "next";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export const viewport: Viewport = { themeColor: "#F08A3C" };

/**
 * Web fallback for the app's "compare your classes" share
 * (https://lagoonucsb.com/friends). App-havers open the app via universal
 * links; everyone else lands here. noindex: thin CTA page.
 */
export const metadata: Metadata = {
  title: { absolute: "Compare schedules with your friends — Lagoon" },
  description:
    "A Gaucho shared their classes with you. Get Lagoon, import your GOLD schedule in about 30 seconds, and see how many classes you share.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://lagoonucsb.com/friends" },
  openGraph: {
    type: "website",
    siteName: "Lagoon",
    title: "Compare schedules with your friends",
    description:
      "Import your GOLD schedule in ~30 seconds and see how many classes you share. Free, built at UCSB.",
    url: "https://lagoonucsb.com/friends",
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
    title: "Compare schedules with your friends",
    description:
      "Import your GOLD schedule in ~30 seconds and see how many classes you share. Free, built at UCSB.",
    images: [
      { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
    ],
  },
};

export default function FriendsPage() {
  return (
    <section id="hero" className="go-hero">
      <div className="go-inner">
        <div className="hero-chip">
          <div className="chip-dot"></div>
          Shared from Lagoon
        </div>
        <h1>
          Compare schedules
          <br />
          with <em>your friends.</em>
        </h1>
        <p className="hero-desc go-desc">
          A Gaucho shared their classes with you. Import your GOLD schedule in
          about 30 seconds and see exactly how many classes — and gaps — you
          share.
        </p>
        <div className="hero-btns go-btns">
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="share-friends"
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
