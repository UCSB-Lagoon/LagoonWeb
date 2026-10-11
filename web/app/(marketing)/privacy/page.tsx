import type { Metadata } from "next";
import Link from "next/link";
import { AdOptOut } from "./opt-out";

export const metadata: Metadata = {
  title: { absolute: "Privacy · Lagoon" },
  description:
    "What the Lagoon app stores and who sees it, what lagoonucsb.com measures, and how to opt out. The app itself runs no ad trackers.",
  alternates: { canonical: "https://www.lagoonucsb.com/privacy" },
  robots: { index: true, follow: true },
};

/**
 * Privacy notice for the app and the website.
 *
 * "In the app" mirrors PrivacyPolicyView in the iOS repo; keep the two in
 * step, since this is the public URL App Store review reads. The app makes
 * no third-party ad tracking promise, and that stays true: the Meta Pixel
 * runs here, on the marketing site, and nowhere in the app. If that ever
 * changes, the App Store privacy labels change with it.
 */
export default function PrivacyPage() {
  return (
    <div className="article-shell">
      <header className="page-hero">
        <h1>Privacy</h1>
        <p>For the Lagoon app and lagoonucsb.com. Last updated 10 October 2026.</p>
      </header>

      <article className="article-card">
        <h2>The short version</h2>
        <ul>
          <li>The Lagoon <strong>app</strong> has no ad trackers and does not share your data with advertisers.</li>
          <li>This <strong>website</strong> uses Google Analytics to count visits, and may use the Meta Pixel to measure Instagram ads.</li>
          <li>We never sell your information for money. You can switch off the Meta Pixel below, and your browser&apos;s Global Privacy Control signal does it automatically.</li>
        </ul>

        <h2>In the app</h2>
        <p>
          Your account needs an email address. Everything else is something you choose to add, and each
          piece is seen only by the people listed here.
        </p>
        <ul>
          <li><strong>Your schedule</strong> is stored on your phone and synced to your account so friends can see shared classes and free time.</li>
          <li><strong>Friends, study groups and messages</strong> are seen by the people in them.</li>
          <li><strong>Chapters.</strong> The chapter you say you&apos;re in is shown only to your friends, and you can hide it from them too. Everyone else sees a member count from five members; that count, from UCSB-verified members only, is public on the <Link href="/cup">Chapter Cup</Link>. Officers see the name and year of people who RSVP to their events.</li>
          <li><strong>Your hall</strong> (optional): the residence hall or apartment you pick. If you show up there, friends who live there see you, and so do other UCSB-verified students who live there and show up too. If you don&apos;t, nobody sees your name. The hall&apos;s count appears once three people have joined.</li>
          <li><strong>&ldquo;I&apos;m going&rdquo;</strong> on a campus event: your friends see your first name; everyone else sees only a count, once three people are going.</li>
          <li><strong>Verifying with your UCSB email</strong> makes that address your account&apos;s email.</li>
          <li><strong>Officers</strong> who ask for access or report money raised share their name, UCSB email, note and any proof with the Lagoon team only, to verify it. A verified total is public on the Chapter Cup.</li>
          <li><strong>Canvas, office hours and homework check-offs stay on your phone.</strong> The Canvas link you paste is kept in the iOS Keychain, and assignments download from Canvas straight to your device. None of it reaches our servers.</li>
          <li><strong>Usage and crash reports:</strong> which screens you open, for how long, and what you share, plus app version, iOS version and device model, linked to your account so we can see what&apos;s working and fix what breaks.</li>
          <li><strong>Meta&apos;s SDK</strong> tells Meta when Lagoon is installed or opened, with device details and an app-generated identifier, so we can see which ads led to installs. Nothing you put into Lagoon goes to Meta or any advertiser. The app never reads your advertising identifier, never shows the &ldquo;Allow tracking&rdquo; prompt, and has no ads.</li>
        </ul>
        <p>
          Data you add is stored with Supabase, with row-level security on every table. You can delete your
          account in the app at any time. That removes your profile, friends, reviews, groups, chapter
          memberships, RSVPs, officer roles, your hall and your &ldquo;going&rdquo; RSVPs from our servers.
        </p>

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
