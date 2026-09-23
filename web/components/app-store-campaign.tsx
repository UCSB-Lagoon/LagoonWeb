"use client";

import { useEffect } from "react";

const CAMPAIGN_KEY = "lagoon_campaign";

/**
 * App Store Connect campaign token for this visit.
 *
 * `ct` is what App Store Connect → Analytics → Sources groups installs by,
 * so it is the one place an Instagram ad can be tied to an actual install.
 * Apple caps it at 40 characters. Taken from the landing URL's UTM tags
 * (Meta fills these from the ad's URL parameters), else the referrer's
 * host, else "web".
 */
export function campaignToken(search: string, referrer: string): string {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source");
  const campaign = params.get("utm_campaign");
  let token = [source, campaign].filter(Boolean).join("-");
  if (!token && params.get("fbclid")) token = "meta";
  if (!token && referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (!host.endsWith("lagoonucsb.com")) token = host;
    } catch {
      /* malformed referrer: fall through */
    }
  }
  return (token || "web").toLowerCase().replace(/[^a-z0-9._-]+/g, "_").slice(0, 40);
}

/**
 * Adds `pt` + `ct` to every App Store link, at click time.
 *
 * Click time rather than render time because many CTAs are static HTML
 * (content/*-body.html) that React never renders. The first landing of a
 * visit decides the campaign, so browsing three pages before tapping still
 * credits the ad that brought them.
 *
 * Inert until NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN is set: Apple ignores
 * `ct` without the provider token. Find it in App Store Connect →
 * Analytics → Acquisition → Campaigns → "Generate a Campaign Link"
 * (the `pt=` value in the generated URL).
 */
export function AppStoreCampaignLinks() {
  useEffect(() => {
    const providerToken = process.env.NEXT_PUBLIC_APPSTORE_PROVIDER_TOKEN;
    if (!providerToken) return;

    let campaign: string;
    try {
      campaign = sessionStorage.getItem(CAMPAIGN_KEY) ?? "";
      if (!campaign) {
        campaign = campaignToken(location.search, document.referrer);
        sessionStorage.setItem(CAMPAIGN_KEY, campaign);
      }
    } catch {
      campaign = campaignToken(location.search, document.referrer);
    }

    const click = (e: MouseEvent) => {
      const anchor =
        e.target instanceof Element
          ? e.target.closest<HTMLAnchorElement>('a[href*="apps.apple.com"]')
          : null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href);
        url.searchParams.set("pt", providerToken);
        url.searchParams.set("ct", campaign);
        url.searchParams.set("mt", "8");
        anchor.href = url.toString();
      } catch {
        /* leave a malformed link alone */
      }
    };
    // Capture phase, so the href is rewritten before the browser follows it.
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);

  return null;
}
