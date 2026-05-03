import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: "UCSB Lagoon — the central hub for Gaucho life",
    template: "%s · UCSB Lagoon",
  },
  description:
    "Live ratings, weekly leaderboards, and a gamified hub for everything happening at UCSB.",
  metadataBase: new URL("https://app.lagoonucsb.com"),
  openGraph: {
    type: "website",
    siteName: "UCSB Lagoon",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
