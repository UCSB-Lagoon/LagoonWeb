import Link from "next/link";

export function Footer() {
  return (
    <footer className="lagoon-footer">
      <div className="lagoon-footer-top">
        <Link href="/" className="lagoon-footer-wordmark">
          Lagoon↗
        </Link>
        <p>
          Made for here.
          <br />
          Built by Gauchos, for Gauchos.
        </p>
        <nav aria-label="Footer">
          <Link href="/guides">Student guides</Link>
          <Link href="/company">About Lagoon</Link>
          <Link href="/captains">Become a captain</Link>
          <Link href="/me">Your account</Link>
        </nav>
      </div>
      <div className="lagoon-footer-bottom">
        <span>© {new Date().getFullYear()} Lagoon</span>
        <span>Independent. Not affiliated with UC Santa Barbara.</span>
      </div>
    </footer>
  );
}
