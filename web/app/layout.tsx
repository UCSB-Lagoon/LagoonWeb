import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: "UCSB Lagoon — Live campus map, leaderboards & stats",
    template: "%s · UCSB Lagoon",
  },
  description:
    "The live web hub for UCSB Lagoon. Interactive campus map with friends nearby, weekly leaderboards, challenges, and aggregate stats from the Lagoon iOS app.",
  applicationName: "UCSB Lagoon",
  keywords: ["UCSB", "Lagoon", "Gaucho", "campus map", "leaderboard", "UCSB students", "Isla Vista"],
  metadataBase: new URL("https://app.lagoonucsb.com"),
  alternates: {
    canonical: "/",
  },
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
    url: "https://app.lagoonucsb.com",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "UCSB Lagoon — Live campus map & leaderboards",
    description:
      "The live web hub for UCSB Lagoon. Campus map, leaderboards, stats.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
