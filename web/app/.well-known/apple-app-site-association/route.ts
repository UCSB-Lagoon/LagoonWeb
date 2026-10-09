import { NextResponse } from "next/server";

/**
 * Universal-links manifest. The iOS app already ships the matching
 * entitlement (applinks:lagoonucsb.com — Lagoon/Lagoon.entitlements in the
 * app repo, appID team VAC259X872, bundle com.lagoon.ucsb); this file is
 * what makes those links actually open the app.
 *
 * Only claim paths the app's DeepLinkRouter can handle AND that have a web
 * fallback page for recipients without the app: never claim a path that
 * would strand a non-user on a 404.
 *
 * Apple's CDN fetches this at /.well-known/apple-app-site-association and
 * requires JSON content-type with no redirect.
 */

const APP_ID = "VAC259X872.com.lagoon.ucsb";

const CLAIMED = [
  "/schedule",
  "/friends",
  "/compare/*",
  "/wrapped",
  "/r/*",
  // "When are we free?" groups and shared weeks (iOS migration 091). Both
  // have real web pages for people without the app.
  "/f/*",
  "/w/*",
  // Chapters and their events (iOS migration 092). DeepLinkRouter has
  // routed `org/{slug}` and `event/{id}` since Lagoon#35; these pages are
  // the fallback for everyone without the app.
  "/org/*",
  "/event/*",
];

const AASA = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: [APP_ID],
        appID: APP_ID,
        paths: CLAIMED,
        components: CLAIMED.map((p) => ({ "/": p })),
      },
    ],
  },
  webcredentials: { apps: [APP_ID] },
};

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(AASA, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
