const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

/**
 * Marketing site footer — the pre-migration .site-footer (already styled
 * in site.css; the last link renders as the orange App Store button).
 * Marketing-appropriate links only, not the app footer's link grid.
 */
export function MarketingFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <a
            className="brand brand-footer"
            href="/"
            aria-label="Lagoon — UCSB campus app"
          >
            <span className="brand-mark" aria-hidden="true">L</span>
            <span className="brand-copy">
              <strong>Lagoon</strong>
              <span>Campus life, beautifully simple.</span>
            </span>
          </a>
          <p className="footer-copy">
            The UCSB campus app built for Gauchos — schedules, dining, grades,
            events, and a live campus map.
          </p>
        </div>
        <div className="footer-links">
          <a href="/guides">Guides</a>
          <a href="/company">Company</a>
          <a href="/ucsb-dining-menu">Dining menu</a>
          <a href={APP_STORE} rel="noreferrer" data-lagoon-cta="footer">
            Download Lagoon
          </a>
        </div>
      </div>
    </footer>
  );
}
