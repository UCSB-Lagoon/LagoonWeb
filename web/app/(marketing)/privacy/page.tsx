import type { Metadata } from "next";
import { AdOptOut } from "./opt-out";

export const metadata: Metadata = {
  title: { absolute: "Privacy · Lagoon" },
  description:
    "What lagoonucsb.com measures, what it shares with Google and Meta, and how to opt out. The Lagoon app itself runs no ad trackers.",
  alternates: { canonical: "https://lagoonucsb.com/privacy" },
  robots: { index: true, follow: true },
};

/**
 * Website privacy notice.
 *
 * Scoped to the website on purpose. The app's policy (PrivacyPolicyView in
 * the iOS repo) promises no third-party ad tracking, and that stays true:
 * the Meta Pixel runs here, on the marketing site, and nowhere in the app.
 * If that ever changes, the App Store privacy labels change with it.
 */
export default function PrivacyPage() {
  return (
    <div className="article-shell">
      <header className="page-hero">
        <h1>Privacy</h1>
        <p>For lagoonucsb.com. Last updated 22 September 2026.</p>
      </header>

      <article className="article-card">
        <h2>The short version</h2>
        <ul>
          <li>The Lagoon <strong>app</strong> has no ad trackers and does not share your data with advertisers.</li>
          <li>This <strong>website</strong> uses Google Analytics to count visits, and may use the Meta Pixel to measure Instagram ads.</li>
          <li>We never sell your information for money. You can switch off the Meta Pixel below, and your browser&apos;s Global Privacy Control signal does it automatically.</li>
        </ul>

        <h2>What this website measures</h2>
        <p>
          <strong>Google Analytics</strong> records pages viewed, how far you scroll, whether you tapped a
          &ldquo;Get the app&rdquo; button, and the device, browser and rough location (city-level) that Google
          infers from your connection. We use it to see which pages help students find Lagoon.
        </p>
        <p>
          <strong>Meta Pixel</strong> (when enabled) tells Meta that a browser visited a page here, and whether it
          tapped through to the App Store. Meta may match that to an Instagram or Facebook account. We use it to
          show Lagoon ads to people who have already visited, and to measure whether our ads work. Under
          California law this counts as &ldquo;sharing&rdquo; personal information for cross-context behavioral
          advertising, which is why you can opt out below.
        </p>
        <p>
          When you arrive from an ad, we also add a campaign label (like <code>instagram-fall_launch</code>) to the
          App Store link so Apple can tell us how many installs a campaign produced. Apple reports those as totals,
          not per person.
        </p>

        <h2>Opt out</h2>
        <AdOptOut />
        <p>
          This is saved in a cookie on this browser, so repeat it on other devices. To limit Google Analytics
          too, use Google&apos;s{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">browser opt-out add-on</a>.
        </p>

        <h2>Signing in on the website</h2>
        <p>
          Signing in to the web hub uses your Lagoon account, stored with our database provider, Supabase. The
          same account rules as the app apply, including deleting your account from the app at any time.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests: <a href="mailto:ucsblagoon@gmail.com">ucsblagoon@gmail.com</a>. Lagoon is an
          independent student project and is not affiliated with the UC Santa Barbara administration.
        </p>
      </article>
    </div>
  );
}
