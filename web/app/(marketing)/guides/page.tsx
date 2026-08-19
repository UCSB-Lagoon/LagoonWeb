import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/static-page";
import { GuideJsonLd } from "@/components/seo/guide-jsonld";
import { getGuideIndex } from "@/lib/guide-index";

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

export default async function GuidesIndexPage() {
  // The captured JSON-LD for this page describes it as a CollectionPage
  // but never enumerates what it collects. An ItemList generated from the
  // guide frontmatter gives crawlers the actual 29 members, in order.
  const guides = await getGuideIndex();
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Lagoon UCSB Guides",
    url: "https://lagoonucsb.com/guides",
    numberOfItems: guides.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.breadcrumbName,
      url: `https://lagoonucsb.com/${g.slug}`,
    })),
  };

  return (
    <>
      <GuideJsonLd blocks={[itemList]} />
      <StaticMarketingPage slug="guides" />
    </>
  );
}
