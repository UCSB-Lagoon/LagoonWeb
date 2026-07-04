import type { Metadata, Viewport } from "next";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export const viewport: Viewport = { themeColor: "#F08A3C" };

/**
 * Web fallback for Schedule Match Card links
 * (https://lagoonucsb.com/compare/<friendId>). App-havers deep-link
 * straight to the comparison via universal links; everyone else lands
 * here. Deliberately generic — we never resolve the friendId to a name
 * on a public page (privacy: only mutual friends see names in-app).
 */
export async function generateMetadata(
  { params }: { params: Promise<{ friendId: string }> }
): Promise<Metadata> {
  const { friendId } = await params;
  const url = `https://lagoonucsb.com/compare/${encodeURIComponent(friendId)}`;
  const title = "A Gaucho wants to compare schedules — Lagoon";
  const description =
    "Get Lagoon, import your GOLD schedule in about 30 seconds, and see how many classes you share.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Lagoon",
      title: "Want to compare schedules?",
      description,
      url,
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
      title: "Want to compare schedules?",
      description,
      images: [
        { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
      ],
    },
  };
}

export default function ComparePage() {
  return (
    <section id="hero" className="go-hero">
      <div className="go-inner">
        <div className="hero-chip">
          <div className="chip-dot"></div>
          Schedule match
        </div>
        <h1>
          Someone wants to
          <br />
          <em>compare schedules.</em>
        </h1>
        <p className="hero-desc go-desc">
          A Gaucho sent you a schedule match. Get Lagoon, import your GOLD
          schedule in about 30 seconds, and see how many classes you share.
        </p>
        <div className="hero-btns go-btns">
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="share-compare"
            className="btn-primary go-cta"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6 6 6-6"/><path d="M3 20h18"/></svg>
            Download Lagoon free
          </a>
        </div>
        <p className="go-meta">
          Already have Lagoon? This link opens the app automatically.
        </p>
      </div>
    </section>
  );
}
