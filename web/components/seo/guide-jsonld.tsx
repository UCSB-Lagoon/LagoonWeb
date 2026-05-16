/**
 * Emits the three JSON-LD blocks every static guide carried, byte-faithful
 * to the originals so the SEO harness stays green:
 *   1. BreadcrumbList  (Home › Guides › <this guide>)
 *   2. Article         (full: image/author/publisher/mainEntityOfPage)
 *   3. Article          (the compact "freshness" block the archived
 *                        add-updated-date.py injected — dateModified only)
 */
const BASE = "https://lagoonucsb.com";

export type GuideFrontmatter = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalPath: string; // e.g. "/ucsb-dining-menu"
  image: string;
  imageAlt: string;
  breadcrumbName: string; // e.g. "UCSB Dining Menu Guide"
  datePublished: string;
  dateModified: string;
  updatedLdDate: string;
  // Page-hero + related-guides chrome (rendered by <GuideShell/>)
  eyebrow: string;
  h1: string;
  updatedStamp: string;
  intro: string;
  metaPills: string[];
  related: { href: string; label: string }[];
  relatedCtaText: string;
};

export function GuideJsonLd({ fm }: { fm: GuideFrontmatter }) {
  const url = `${BASE}${fm.canonicalPath}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${BASE}/guides` },
      { "@type": "ListItem", position: 3, name: fm.breadcrumbName, item: url },
    ],
  };

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: fm.title,
    description: fm.description,
    datePublished: fm.datePublished,
    dateModified: fm.dateModified,
    inLanguage: "en-US",
    image: { "@type": "ImageObject", url: fm.image, width: 1200, height: 630 },
    author: { "@type": "Organization", name: "Lagoon" },
    publisher: {
      "@type": "Organization",
      name: "Lagoon",
      url: BASE,
      logo: { "@type": "ImageObject", url: `${BASE}/logo.svg` },
    },
    mainEntityOfPage: url,
  };

  const updated = {
    "@context": "https://schema.org",
    "@type": "Article",
    dateModified: fm.updatedLdDate,
    publisher: { "@type": "Organization", name: "Lagoon" },
  };

  return (
    <>
      {[breadcrumb, article, updated].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
