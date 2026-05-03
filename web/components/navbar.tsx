import Link from "next/link";
import { Trophy, Waves, Target, Map, User } from "lucide-react";

const links = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/challenges",  label: "Challenges",  icon: Target },
  { href: "/map",         label: "Map",         icon: Map },
  { href: "/me",          label: "You",         icon: User },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-deep/60 border-b border-lagoon-200/10">
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg">
          <Waves className="w-5 h-5 text-lagoon-400" />
          <span className="text-gradient-lagoon font-semibold">UCSB Lagoon</span>
        </Link>
        <ul className="flex items-center gap-1 text-sm text-mist/70">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-lagoon-200/5 hover:text-mist transition"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
