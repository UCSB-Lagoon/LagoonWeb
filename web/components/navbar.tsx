"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { GroupLink } from "./group-link";
import { isCampusPath } from "@/lib/routes";

const links = [
  { href: "/hub", label: "Campus" },
  { href: "/guides", label: "Guides" },
  { href: "/company", label: "About" },
];
const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (event.key !== "Tab") return;
      const items = menu.current?.querySelectorAll<HTMLAnchorElement>("a");
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (
        (!event.shiftKey && document.activeElement === last) ||
        (event.shiftKey && document.activeElement === first)
      ) {
        event.preventDefault();
        toggle.current?.focus();
      } else if (event.shiftKey && document.activeElement === toggle.current) {
        event.preventDefault();
        last.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 760) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);
  const campusActive = isCampusPath(pathname);
  return (
    <header className="lagoon-header">
      <nav className="lagoon-nav" aria-label="Primary">
        <GroupLink
          href="/"
          className="lagoon-brand"
          onClick={() => setOpen(false)}
          aria-label="Lagoon home"
        >
          <span aria-hidden="true">L</span>
          <strong>
            Lagoon<small>UC SANTA BARBARA</small>
          </strong>
        </GroupLink>
        <div className="lagoon-nav-links">
          {links.map(({ href, label }) => (
            <GroupLink
              key={href}
              href={href}
              aria-current={
                pathname === href || (href === "/hub" && campusActive)
                  ? "page"
                  : undefined
              }
            >
              {label}
            </GroupLink>
          ))}
        </div>
        <div className="lagoon-nav-actions">
          <ThemeToggle />
          <a className="lagoon-button" href={APP_STORE} data-lagoon-cta="nav">
            Get the app <span aria-hidden="true">↗</span>
          </a>
          <button
            ref={toggle}
            className="lagoon-menu-toggle"
            aria-expanded={open}
            aria-controls={open ? "lagoon-menu" : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        // Focus is trapped here and the page behind cannot scroll, so the
        // panel is modal in behaviour even though it pushes the page down
        // rather than covering it. The dialog semantics say so, instead of
        // leaving assistive tech to read a page the keyboard cannot reach.
        <div
          ref={menu}
          id="lagoon-menu"
          className="lagoon-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <nav aria-label="Mobile navigation">
            {[...links, { href: "/me", label: "Your account" }].map(
              ({ href, label }) => (
                <GroupLink key={href} href={href} onClick={() => setOpen(false)}>
                  {label}
                  <span aria-hidden="true">↗</span>
                </GroupLink>
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
