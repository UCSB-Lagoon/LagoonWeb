"use client";

import { useState } from "react";

/**
 * The marketing announce strip (was inline in every static page).
 * Marketing-only chrome — not part of the shared app shell.
 */
export function AnnounceBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="announce-bar" id="announce-bar">
      <span>🌯 We just raised $10 to buy one burrito</span>
      <button
        className="announce-close"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
      >
        ×
      </button>
    </div>
  );
}
