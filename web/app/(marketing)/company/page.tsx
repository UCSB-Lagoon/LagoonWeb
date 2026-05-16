import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/static-page";

export const metadata: Metadata = {
  title: { absolute: "About Lagoon | Built for Gauchos, by Gauchos" },
  description:
    "Learn about Lagoon, the student-built UCSB campus app for schedules, dining menus, campus events, student news, and grade data.",
  alternates: { canonical: "https://lagoonucsb.com/company" },
  openGraph: {
    type: "website",
    title: "About Lagoon | Built for Gauchos, by Gauchos",
    description:
      "The story behind Lagoon and why it was built for the real rhythm of student life at UCSB.",
    url: "https://lagoonucsb.com/company",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "About Lagoon | Built for Gauchos, by Gauchos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Lagoon | Built for Gauchos, by Gauchos",
    description:
      "The story behind Lagoon and why it was built for the real rhythm of student life at UCSB.",
    images: [
      {
        url: "https://lagoonucsb.com/og-card.png",
        alt: "About Lagoon | Built for Gauchos, by Gauchos",
      },
    ],
  },
};

export default function CompanyPage() {
  return <StaticMarketingPage slug="company" />;
}
