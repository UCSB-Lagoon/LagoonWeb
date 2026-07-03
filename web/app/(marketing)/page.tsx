import type { Metadata, Viewport } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GuideJsonLd } from "@/components/seo/guide-jsonld";
import { HomeClient } from "@/components/marketing/home-client";

const URL = "https://lagoonucsb.com/";

export const viewport: Viewport = { themeColor: "#F08A3C" };

export const metadata: Metadata = {
  title: { absolute: "Lagoon — UCSB Campus App: Your GOLD Schedule in 30 Seconds" },
  description:
    "Import your UCSB GOLD schedule in about 30 seconds, get a beautiful Today view with home-screen widgets, and see how many Gauchos share your classes. Plus real grade distributions, live dining menus, and a live campus map. Free, built at UCSB.",
  keywords:
    "UCSB, UCSB app, Lagoon UCSB, UCSB schedule, UCSB schedule app, GOLD schedule import, who's in my class UCSB, UCSB grades, UCSB dining, GOLD sync, Daily Nexus, Isla Vista, Gaucho, UCSB student app, UCSB grade distribution",
  authors: [{ name: "Lagoon" }],
  alternates: {
    canonical: "/",
    languages: { en: URL, "x-default": URL },
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Lagoon",
    locale: "en_US",
    title: "Lagoon — Your UCSB schedule, beautiful in 30 seconds",
    description:
      "Snap your GOLD schedule, get a gorgeous Today view + widgets, and see who's in your classes. Free, built at UCSB.",
    url: URL,
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "Lagoon — the UCSB campus app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lagoon — Your UCSB schedule, beautiful in 30 seconds",
    description:
      "Snap your GOLD schedule, get a gorgeous Today view + widgets, and see who's in your classes. Free, built at UCSB.",
    images: [
      { url: "https://lagoonucsb.com/og-card.png", alt: "Lagoon — the UCSB campus app" },
    ],
  },
};

export default async function HomePage() {
  const dir = join(process.cwd(), "content");
  const [body, blocks] = await Promise.all([
    readFile(join(dir, "home-body.html"), "utf8"),
    readFile(join(dir, "home.jsonld.json"), "utf8").then(
      (s) => JSON.parse(s) as unknown[]
    ),
  ]);
  return (
    <>
      <GuideJsonLd blocks={blocks} />
      {/* Trusted first-party presentational markup (our own home.html
          body). Kept as-is for pixel parity; styled by site.css. */}
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <HomeClient />
    </>
  );
}
