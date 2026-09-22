"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/**
 * Streams already configured in THIS document.
 *
 * GA4 can configure a stream but has no way to un-configure one, so a
 * `config` call outlives the component that made it. Module scope is
 * exactly the lifetime we want: it survives a layout remounting during a
 * soft navigation, and resets on a real page load.
 *
 * Two bugs this guards against, both measured on the built site:
 *
 *  - Re-running `config` on every route change. `pathname` used to be an
 *    effect dependency, so /→/hub→/stats pushed three `js` + three
 *    `config` calls. Re-configuring a live stream re-initialises it and
 *    can restart the session.
 *  - A second stream joining the first. If both groups' analytics ever
 *    mount in one document, `config` fires for both ids and GA4's
 *    enhanced measurement (outbound clicks, scroll, downloads, form
 *    interactions) — which the library emits per configured stream with
 *    NO `send_to` — reports into both. The Set cannot prevent that on its
 *    own; components/group-link.tsx is what keeps the groups in separate
 *    documents. This is here so the failure is one `config`, not one per
 *    navigation, if a link ever slips through.
 */
const configured = new Set<string>();

/** Route-scoped listeners keep each visit on its own analytics stream. */
function RouteAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const page = pathname + (search.size ? `?${search}` : "");

  // Bootstrap the stream once per document.
  useEffect(() => {
    if (configured.has(gaId)) return;
    configured.add(gaId);
    const win = window as AnalyticsWindow;
    win.dataLayer ??= [];
    // Google's command queue uses the Arguments object as its message format.
    win.gtag ??= function () {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    win.gtag("js", new Date());
    win.gtag("config", gaId, { send_page_view: false });
  }, [gaId]);

  // One page_view per route, addressed so it lands on this stream only.
  // Declared after the bootstrap effect so it runs after it on mount.
  useEffect(() => {
    (window as AnalyticsWindow).gtag?.("event", "page_view", {
      send_to: gaId,
      page_path: page,
      page_location: location.href,
    });
  }, [gaId, page]);

  useEffect(() => {
    const win = window as AnalyticsWindow;
    const event = (name: string, fields: Record<string, unknown>) =>
      win.gtag?.("event", name, {
        ...fields,
        send_to: gaId,
        page_path: pathname,
      });
    const click = (e: MouseEvent) => {
      const anchor =
        e.target instanceof Element
          ? e.target.closest<HTMLAnchorElement>('a[href*="apps.apple.com"]')
          : null;
      if (!anchor) return;
      const source = anchor.getAttribute("data-lagoon-cta") || "inline";
      event("app_store_click", { cta_source: source, link_url: anchor.href });
      event("conversion", { cta_source: source });
    };
    const referral = pathname.match(/^\/r\/([a-zA-Z0-9_-]{2,32})$/);
    if (referral) document.cookie = `lagoon_ref=${referral[1]}; path=/; max-age=${60 * 60 * 24 * 60}; SameSite=Lax`;
    const hit = new Set<number>();
    const scroll = () => {
      const h = document.documentElement;
      const percent = Math.round(
        ((h.scrollTop + innerHeight) / h.scrollHeight) * 100,
      );
      for (const milestone of [25, 50, 75, 100])
        if (!hit.has(milestone) && percent >= milestone) {
          hit.add(milestone);
          event("scroll_depth", { percent: milestone });
        }
    };
    document.addEventListener("click", click, true);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("scroll", scroll);
    };
  }, [gaId, pathname]);
  return null;
}

/**
 * GA4 + Lagoon conversion events, parameterized by stream.
 *
 * The marketing pages and the app report to SEPARATE GA4 streams and this
 * must stay true (see ONBOARDING / memory): marketing → G-2F8CTN4DNP,
 * app → G-5HY7LBXP8G. The (marketing) and (app) group layouts each render
 * this with their own id so a page only ever emits to its own stream.
 *
 * Keeping that true takes two things, because a soft navigation does not
 * discard the previous group's `config`:
 *
 *  1. Every event carries an explicit `send_to`. Un-addressed events go to
 *     every configured stream.
 *  2. Links that leave the route group are full page loads, via
 *     components/group-link.tsx. Without that, one visit configures both
 *     ids and GA4's own enhanced-measurement events — which we do not
 *     emit and cannot address — cross-report.
 *
 * e2e/navigation.spec.ts asserts both: one gtag.js tag and one `config`
 * per document, and page_views on the right id after soft navigation.
 *
 * The events block is the same logic the old static marketing pages and
 * the app layout both shipped: App Store outbound → app_store_click +
 * conversion, scroll-depth milestones, and /r/<code> referral cookie.
 */
export function SiteAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <RouteAnalytics gaId={gaId} />
      </Suspense>
    </>
  );
}
