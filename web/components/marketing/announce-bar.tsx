"use client";

import { useState } from "react";

const KEY = "lagoon_announce_dismissed";

/**
 * The marketing announce strip.
 *
 * Dismissal persists across visits, but the *hiding* is done by CSS, not
 * by React: the boot script in app/layout.tsx puts `announce-dismissed`
 * on <html> before first paint, and site.css hides the strip from there.
 * That keeps the server and client markup identical (no hydration
 * mismatch) while avoiding the layout shift a returning visitor used to
 * get when the bar rendered and then vanished on mount.
 */
export function AnnounceBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="announce-bar" id="announce-bar">
      <span className="announce-copy">
        <span className="announce-tag">Fall 2026</span>
        Classes start Thursday, September 24 —{" "}
        <a href="/ucsb-fall-2026-start-date">see every key date</a>
      </span>
      <button
        className="announce-close"
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          document.documentElement.classList.add("announce-dismissed");
          setDismissed(true);
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
        }}
      >
        ×
      </button>
    </div>
  );
}
