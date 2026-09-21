import Link from "next/link";

export function CampusHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="campus-page-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <div>{description}</div>
    </header>
  );
}
export function CampusNav({ current }: { current: string }) {
  return (
    <nav className="campus-subnav" aria-label="Campus tools">
      {[
        ["/hub", "Overview"],
        ["/stats", "By the numbers"],
        ["/map", "Campus map"],
        ["/leaderboard", "Leaderboard"],
        ["/challenges", "Challenges"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={current === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
