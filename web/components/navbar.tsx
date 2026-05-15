"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Trophy, Target, Map, User, BarChart3, Menu, X, Download, Home } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/hub",           label: "Hub",         icon: Home },
  { href: "/leaderboard",   label: "Leaderboard", icon: Trophy },
  { href: "/challenges",    label: "Challenges",  icon: Target },
  { href: "/stats",         label: "Stats",       icon: BarChart3, live: true },
  { href: "/map",           label: "Map",         icon: Map },
  { href: "/me",            label: "You",         icon: User },
];

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-40 transition-all duration-200",
        "backdrop-blur-xl",
        scrolled
          ? "bg-cream-50/85 border-b border-cream-200/80 shadow-[0_1px_0_rgba(30,20,16,0.02),0_8px_24px_-18px_rgba(176,110,60,0.18)]"
          : "bg-cream-50/60 border-b border-transparent",
      ].join(" ")}
    >
      <nav
        aria-label="Primary"
        className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between"
      >
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white font-display font-extrabold text-lg leading-none shadow-[0_6px_18px_-8px_rgba(240,138,60,0.7)] transition-transform group-hover:rotate-[-4deg]"
          >
            L
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display font-bold text-lg tracking-tight text-ink-900">Lagoon</span>
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-400">UCSB</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1 text-sm text-ink-500">
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
                {live ? <span className="live-dot" aria-hidden="true" /> : <Icon className="w-4 h-4" />}
                <span>{label}</span>
              </Link>
            </li>
          ))}
          <li><ThemeToggle /></li>
          <li className="ml-1">
            <a
              href={APP_STORE}
              rel="noreferrer"
              data-lagoon-cta="nav"
              className="btn-primary !py-2 !px-4 text-sm"
            >
              <Download className="w-4 h-4" /> Get the App
            </a>
          </li>
        </ul>

        {/* Mobile right cluster */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="nav-mobile"
            className="btn-primary !py-1.5 !px-3 text-sm"
          >
            <Download className="w-3.5 h-3.5" /> App
          </a>
          <button
            onClick={() => setOpen(v => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid place-items-center w-10 h-10 rounded-full border border-cream-200 bg-white text-ink-900 hover:bg-cream-100 transition"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={[
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t",
          open ? "max-h-[80vh] opacity-100 border-cream-200" : "max-h-0 opacity-0 border-transparent",
        ].join(" ")}
      >
        <ul className="px-5 py-4 space-y-1 bg-cream-50/95 backdrop-blur-xl">
          {links.map(({ href, label, icon: Icon, live }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-cream-100 text-ink-900 font-medium"
              >
                {live ? <span className="live-dot" aria-hidden="true" /> : <Icon className="w-5 h-5 text-orange-500" />}
                <span>{label}</span>
                {live && <span className="ml-auto text-[10px] uppercase tracking-wider text-orange-600 font-bold">Live</span>}
              </Link>
            </li>
          ))}
          <li className="pt-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-ink-400 font-semibold px-3">Theme</span>
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </header>
  );
}
