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
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-deep/72 border-b border-amber/10">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber text-deep shadow-[0_0_28px_-12px_rgba(254,188,17,0.9)]">
            <Waves className="w-5 h-5" />
          </span>
          <span className="font-extrabold tracking-[-0.04em]">
            UCSB <span className="text-gradient-lagoon">Lagoon</span>
          </span>
        </Link>
        <ul className="flex items-center gap-1 text-sm text-mist/70">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-amber/10 hover:text-mist transition"
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
