import type { Metadata, Viewport } from "next";
import Script from "next/script";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export const viewport: Viewport = { themeColor: "#F08A3C" };

/**
 * /go — the QR-code landing for printed flyers, orientation tabling, and
 * Instagram bios. One viewport, one CTA, statically prerendered for speed.
 * Source attribution: point QR codes at /go?src=flyer-orientation etc. —
 * GA4 records the query string on page_view, and the inline script below
 * folds the source into the CTA's data-lagoon-cta so app_store_click
 * conversions carry it too.
 *
 * noindex: campaign lander — the homepage is the canonical pitch page,
 * and we don't want the two competing in search.
 */
export const metadata: Metadata = {
  title: { absolute: "Get Lagoon — the UCSB campus app" },
  description:
    "Your GOLD schedule, beautiful in 30 seconds. Free for UCSB students.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://lagoonucsb.com/go" },
};

export default function GoPage() {
  return (
    <>
      <section id="hero" className="go-hero">
        <div className="go-inner">
          <div className="hero-chip">
            <div className="chip-dot"></div>
            Free · Built at UCSB
          </div>
          <h1>
            Your schedule,
            <br />
            beautiful in <em>30 seconds.</em>
          </h1>
          <p className="hero-desc go-desc">
            Snap a screenshot of GOLD — Lagoon builds your Today view and
            widgets, and shows you who&apos;s in your classes.
          </p>
          <div className="hero-btns go-btns">
            <a
              href={APP_STORE}
              rel="noreferrer"
              id="go-cta"
              data-lagoon-cta="go"
              className="btn-primary go-cta"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6 6 6-6"/><path d="M3 20h18"/></svg>
              Download Lagoon free
            </a>
          </div>
          <p className="go-meta">
            iPhone · UCSB students only · no spam, ever
          </p>
        </div>
      </section>
      <Script id="go-src" strategy="afterInteractive">
        {`try {
  var src = new URLSearchParams(location.search).get('src');
  if (src) {
    src = src.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    var a = document.getElementById('go-cta');
    if (a && src) a.setAttribute('data-lagoon-cta', 'go-' + src);
    if (window.gtag && src) gtag('event', 'go_landing', { go_source: src });
  }
} catch (e) {}`}
      </Script>
    </>
  );
}
