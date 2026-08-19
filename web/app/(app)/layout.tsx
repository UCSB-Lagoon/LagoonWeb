import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminBar } from "@/components/admin-bar";
import { FeedbackWidget } from "@/components/feedback-widget";
import { SiteAnalytics } from "@/components/site-analytics";

/**
 * The live web app shell — /hub, /leaderboard, /stats, /map, /me,
 * /challenges, /captains, /admin, /r, /login, /auth, /api.
 * Reports to the APP GA4 stream (G-5HY7LBXP8G). Default metadata for
 * app pages that don't export their own (moved here from the root
 * layout so it doesn't leak onto marketing pages).
 */
export const metadata: Metadata = {
  title: {
    default: "UCSB Lagoon — Live campus map, leaderboards & stats",
    template: "%s · UCSB Lagoon",
  },
  description:
    "The live web hub for UCSB Lagoon. Interactive campus map with friends nearby, weekly leaderboards, challenges, and aggregate stats from the Lagoon iOS app.",
  applicationName: "UCSB Lagoon",
  keywords: ["UCSB", "Lagoon", "Gaucho", "campus map", "leaderboard", "UCSB students", "Isla Vista"],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "UCSB Lagoon",
    title: "UCSB Lagoon — Live campus map, leaderboards & stats",
    description:
      "Interactive UCSB campus map with friends nearby, weekly leaderboards, and live stats from the Lagoon iOS app.",
    url: "https://lagoonucsb.com",
    images: ["/og-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "UCSB Lagoon — Live campus map & leaderboards",
    description: "The live web hub for UCSB Lagoon. Campus map, leaderboards, stats.",
    images: ["/og-card.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: { capable: true, title: "Lagoon" },
  other: {
    "apple-itunes-app": "app-id=6760681142, app-argument=https://lagoonucsb.com/",
  },
};

/**
 * Display serif for the `.italic-accent` flourish. Declared here rather
 * than in the root layout so marketing pages — which never render it —
 * don't preload two font files they have no use for.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} app-shell flex flex-1 flex-col`}>
      <AdminBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FeedbackWidget />
      <SiteAnalytics gaId="G-5HY7LBXP8G" />
    </div>
  );
}
