import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

/**
 * Root layout — intentionally minimal. Shared chrome, GA stream, and the
 * DEFAULT metadata live in the route-group layouts so each section owns
 * its own SEO surface and the app's keywords/appleWebApp/og don't leak
 * onto the marketing pages:
 *   app/(app)/layout.tsx        — live web app shell + app metadata
 *   app/(marketing)/layout.tsx  — marketing/guides shell + marketing metadata
 *
 * Only metadataBase is global (so relative canonical/OG URLs resolve).
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://lagoonucsb.com"),
};

/**
 * Fonts are self-hosted by next/font and preloaded from our own origin.
 * They used to be an `@import url(fonts.googleapis.com)` at the top of
 * BOTH globals.css and app/(marketing)/site.css, which made the critical path
 * HTML → our CSS → Google's CSS → the font files — three serial round
 * trips, two of them cross-origin, before any text could paint. Both
 * stylesheets now read the variables declared here.
 *
 * Fraunces is declared in app/(app)/layout.tsx instead: only the app
 * surfaces render it, and preloading it here made every marketing page
 * fetch two font files it never uses.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-space-mono",
});

/**
 * Runs before first paint, so nothing flashes or shifts:
 *  - `dark`      — restores the saved (or OS) colour scheme.
 *  - `js`        — marks that JavaScript is alive. The marketing
 *                  scroll-reveal only hides content behind this class, so
 *                  a no-JS visitor gets the full page instead of a blank
 *                  one (see the REVEAL block in app/(marketing)/site.css).
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
