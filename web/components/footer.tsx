import { GroupLink } from "./group-link";

export function Footer() {
  return (
    <footer className="lagoon-footer">
      <div className="lagoon-footer-top">
        <GroupLink href="/" className="lagoon-footer-wordmark">
          Lagoon<span aria-hidden="true">↗</span>
        </GroupLink>
        <p>
          Made for here.
          <br />
          Built by Gauchos, for Gauchos.
        </p>
        <nav aria-label="Footer">
          <GroupLink href="/guides">Student guides</GroupLink>
          <GroupLink href="/stats">Campus stats</GroupLink>
          <GroupLink href="/company">About Lagoon</GroupLink>
          <GroupLink href="/captains">Become a captain</GroupLink>
          <GroupLink href="/me">Your account</GroupLink>
        </nav>
      </div>
      <div className="lagoon-footer-bottom">
        <span>© {new Date().getFullYear()} Lagoon</span>
        <span>Independent. Not affiliated with UC Santa Barbara.</span>
      </div>
    </footer>
  );
}
