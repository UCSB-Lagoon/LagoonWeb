"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#classmates", label: "Community" },
  { href: "/stats", label: "Live data" },
  { href: "/guides", label: "Guides" },
  { href: "/company", label: "About" },
];

/**
 * Mobile nav for the marketing header. The static site had no mobile
 * navigation at all below 960px (just "Get the App"); this adds a
 * proper drawer. Hidden ≥960px via .mnav (site.css), where .nav-mid
 * takes over.
 */
export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="mnav">
      <button
        type="button"
        className="mnav-btn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="mnav-drawer" role="dialog" aria-label="Site menu">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a
            className="mnav-cta"
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="nav-mobile"
            onClick={() => setOpen(false)}
          >
            Get the App
          </a>
        </div>
      )}
    </div>
  );
}
