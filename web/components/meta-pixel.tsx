"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

type PixelWindow = Window & { fbq?: Fbq; _fbq?: Fbq };

/**
 * Meta's official loader stub, typed. fbevents.js does not replace
 * `window.fbq`: it replays `queue` and then installs `callMethod`, so a stub
 * without that hand-off keeps queueing forever after the script loads.
 */
function installStub(win: PixelWindow) {
  if (win.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  win.fbq = fbq;
  win._fbq ??= fbq;
}

/** Set by /privacy's opt-out button. Checked before anything loads. */
export const AD_OPT_OUT_COOKIE = "lagoon_ads_optout";

/**
 * Whether this visitor has said no to ad measurement.
 *
 * Global Privacy Control is a legally recognized opt-out of "sharing" under
 * the CCPA/CPRA, and every UCSB visitor is in California. A pixel that feeds
 * Instagram ad targeting is exactly that sharing, so GPC means the script
 * never loads — not "loads and is told to behave".
 */
export function hasOptedOutOfAds(): boolean {
  if (typeof window === "undefined") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl) return true;
  return document.cookie.split("; ").some((c) => c === `${AD_OPT_OUT_COOKIE}=1`);
}

/** Admin and auth pages are ours, not an audience. */
function isTrackedPath(pathname: string) {
  return !/^\/(admin|auth|login|me)(\/|$)/.test(pathname);
}

/** Inits once per document, like SiteAnalytics' GA4 guard. */
let initialized = false;

function PixelEvents({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const win = window as PixelWindow;
    if (!initialized) {
      initialized = true;
      installStub(win);
      win.fbq!("init", pixelId);
    }
    if (isTrackedPath(pathname)) win.fbq?.("track", "PageView");
  }, [pixelId, pathname]);

  useEffect(() => {
    if (!isTrackedPath(pathname)) return;
    const click = (e: MouseEvent) => {
      const anchor =
        e.target instanceof Element
          ? e.target.closest<HTMLAnchorElement>('a[href*="apps.apple.com"]')
          : null;
      if (!anchor) return;
      const source = anchor.getAttribute("data-lagoon-cta") || "inline";
      const fbq = (window as PixelWindow).fbq;
      // `Lead` is the standard event Meta can optimise ad delivery toward;
      // the custom event keeps the CTA breakdown for reporting.
      fbq?.("track", "Lead", { content_name: "app_store", content_category: source });
      fbq?.("trackCustom", "AppStoreClick", { cta_source: source, page_path: pathname });
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [pathname]);

  return null;
}

/**
 * Meta (Instagram) Pixel.
 *
 * Renders nothing unless NEXT_PUBLIC_META_PIXEL_ID is set, so merging this
 * changes nothing until the pixel exists in Events Manager.
 *
 * What it sends, and only this: PageView per route, and Lead +
 * AppStoreClick when someone taps through to the App Store. That is enough
 * for Instagram to (a) build a retargeting audience of site visitors, (b)
 * build lookalikes from people who tapped "Get the app", and (c) optimise
 * website-traffic campaigns toward taps rather than cheap clicks.
 *
 * It cannot see installs — the App Store is Apple's page. Install
 * attribution comes from App Store Connect campaign links (see
 * lib/app-store-link.ts) and, for app-install ads, from SKAdNetwork.
 */
export function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(!hasOptedOutOfAds());
  }, []);

  if (!pixelId || !allowed) return null;
  return (
    <>
      <Script
        id="meta-pixel"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PixelEvents pixelId={pixelId} />
      </Suspense>
    </>
  );
}
