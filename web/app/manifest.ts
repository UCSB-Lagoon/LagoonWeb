import type { MetadataRoute } from "next";

/**
 * Web app manifest. The site is a shell around a native iOS app, so this
 * is deliberately modest — it exists so the live web surfaces (/hub,
 * /map, /leaderboard) install cleanly when a student adds them to their
 * home screen, and so Lighthouse/PWA checks stop flagging a missing
 * manifest. `display: browser` because these pages are links-and-scroll
 * documents, not an app shell that should lose the browser chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lagoon — UCSB Campus App",
    short_name: "Lagoon",
    description:
      "The free UCSB campus app: import your GOLD schedule in about 30 seconds, see who's in your classes, plus grade data, live dining menus, and a live campus map.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#faf6ee",
    theme_color: "#f08a3c",
    lang: "en-US",
    categories: ["education", "productivity", "social"],
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
