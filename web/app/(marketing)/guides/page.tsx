import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/static-page";

export const metadata: Metadata = {
  title: { absolute: "UCSB Student Guides | Lagoon" },
  description:
    "Browse Lagoon's UCSB student guides for freshmen, dorm life, move-in, meal plans, GOLD, class planning, study spots, and everyday campus questions.",
  alternates: { canonical: "https://lagoonucsb.com/guides" },
  openGraph: {
    type: "website",
    title: "UCSB Student Guides | Lagoon",
    description:
      "Student-first UCSB guides from Lagoon for freshmen, transfer students, newly admitted students, and current Gauchos.",
    url: "https://lagoonucsb.com/guides",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "UCSB Student Guides | Lagoon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UCSB Student Guides | Lagoon",
    description:
      "Student-first UCSB guides from Lagoon for freshmen, transfer students, newly admitted students, and current Gauchos.",
    images: [
      { url: "https://lagoonucsb.com/og-card.png", alt: "UCSB Student Guides | Lagoon" },
    ],
  },
};

export default function GuidesIndexPage() {
  return <StaticMarketingPage slug="guides" />;
}
