import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
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

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
