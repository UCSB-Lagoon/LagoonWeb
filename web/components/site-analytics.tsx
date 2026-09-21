"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Route-scoped listeners keep each visit on its own analytics stream. */
function RouteAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    const win = window as AnalyticsWindow;
    win.dataLayer ??= [];
    // Google’s command queue uses the Arguments object as its message format.
    win.gtag ??= function () {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    win.gtag("js", new Date());
    win.gtag("config", gaId, { send_page_view: false });
    win.gtag("event", "page_view", {
      send_to: gaId,
      page_path: pathname + (search.size ? `?${search}` : ""),
      page_location: location.href,
    });
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
  }, [gaId, pathname, search]);
  return null;
}

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
