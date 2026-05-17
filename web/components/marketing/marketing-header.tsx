import { ThemeToggle } from "@/components/theme-toggle";
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

/**
 * Marketing site header — the pre-migration marketing nav (Features /
 * Community / Live data / Guides / Company), NOT the app nav. Uses the
 * unified .site-header design already in site.css. Marketing pages
 * deliberately don't carry the app's Hub/Leaderboard/etc. links or the
 * theme toggle (dark mode follows the OS via site.css, like before).
 */
export function MarketingHeader() {
  return (
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand" href="/" aria-label="Lagoon — UCSB campus app">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span className="brand-copy">
            <strong>Lagoon</strong>
            <span>UCSB</span>
          </span>
        </a>
        <div className="nav-mid">
          <a href="/#features">Features</a>
          <a href="/#classmates">Community</a>
          <a href="/stats" rel="noopener">Live data</a>
          <a href="/guides">Guides</a>
          <a href="/company">Company</a>
        </div>
        <div className="nav-right">
          <ThemeToggle />
          <a className="nav-explore" href="/guides">Explore</a>
          <a
            className="nav-cta"
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="nav"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 16V4M6 10l6 6 6-6" />
              <path d="M3 20h18" />
            </svg>
            Get the App
          </a>
          <MarketingMobileNav />
        </div>
      </div>
    </header>
  );
}
