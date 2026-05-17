"use client";

import { useEffect, useState } from "react";

const KEY = "lagoon_announce_dismissed";

/**
 * The marketing announce strip (was inline in every static page).
 * Dismissal now persists across visits via localStorage instead of
 * reappearing every navigation. Renders visible by default (SSR) and
 * hides on mount if previously dismissed — a brief flash is acceptable
 * vs. the layout shift of rendering nothing until hydrated.
 */
export function AnnounceBar() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") setOpen(false);
    } catch {}
  }, []);

  if (!open) return null;

  return (
    <div className="announce-bar" id="announce-bar">
      <span>🌯 We just raised $10 to buy one burrito</span>
      <button
        className="announce-close"
        aria-label="Dismiss announcement"
        onClick={() => {
          setOpen(false);
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
