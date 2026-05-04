import Link from "next/link";
import { Trophy, Target, Map, User, Vote, BarChart3 } from "lucide-react";

const links = [
  { href: "/leaderboard",   label: "Leaderboard", icon: Trophy },
  { href: "/challenges",    label: "Challenges",  icon: Target },
  { href: "/election-pulse",label: "Election",    icon: Vote },
  { href: "/stats",         label: "Stats",       icon: BarChart3, live: true },
  { href: "/map",           label: "Map",         icon: Map },
  { href: "/me",            label: "You",         icon: User },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-cream-50/85 border-b border-cream-200/80">
      <nav
        aria-label="Primary"
        className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 font-display font-bold text-xl tracking-tight"
        >
          <span className="text-orange-500 transition-colors group-hover:text-orange-600">Lagoon</span>
          <span className="text-ink-300 text-sm font-medium hidden sm:inline tracking-normal">UCSB</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm text-ink-500">
          {links.map(({ href, label, icon: Icon, live }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex items-center gap-1.5 px-3 py-2 rounded-full transition",
                  "hover:bg-cream-100 hover:text-ink-900",
                  live ? "text-orange-700 font-semibold" : "",
                ].filter(Boolean).join(" ")}
              >
                {live ? (
                  <span className="live-dot" aria-hidden="true" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden md:inline">{label}</span>
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <Link href="/login" className="btn-primary !py-2 !px-4 text-sm">Get the App</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
