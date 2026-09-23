"use client";

import { useEffect, useState } from "react";
import { AD_OPT_OUT_COOKIE, hasOptedOutOfAds } from "@/components/meta-pixel";

/**
 * "Do Not Sell or Share" for this browser. Sets a first-party cookie the
 * pixel checks before it loads; reloads so an already-loaded pixel is gone.
 */
export function AdOptOut() {
  const [optedOut, setOptedOut] = useState<boolean | null>(null);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    setGpc(Boolean(nav.globalPrivacyControl));
    setOptedOut(hasOptedOutOfAds());
  }, []);

  if (optedOut === null) return null;

  if (gpc) {
    return (
      <p>
        <strong>Your browser sends Global Privacy Control, so ad measurement is already off here.</strong>
      </p>
    );
  }

  const set = (value: boolean) => {
    const maxAge = value ? 60 * 60 * 24 * 365 * 2 : 0;
    document.cookie = `${AD_OPT_OUT_COOKIE}=${value ? 1 : 0}; path=/; max-age=${maxAge}; SameSite=Lax`;
    location.reload();
  };

  return optedOut ? (
    <p>
      <strong>You&apos;ve opted out on this browser.</strong>{" "}
      <button type="button" className="button button-secondary" onClick={() => set(false)}>
        Turn ad measurement back on
      </button>
    </p>
  ) : (
    <p>
      <button type="button" className="button button-primary" onClick={() => set(true)}>
        Do not sell or share my information
      </button>
    </p>
  );
}
