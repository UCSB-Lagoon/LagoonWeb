import Link from "next/link";
import { CAMPUS_TOOLS } from "@/lib/routes";

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
/**
 * Every campus tool lives in the (app) group, so these stay soft
 * navigations — see components/group-link.tsx for when they would not.
 */
export function CampusNav({ current }: { current: string }) {
  return (
    <nav className="campus-subnav" aria-label="Campus tools">
      {CAMPUS_TOOLS.map(({ href, label }) => (
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
