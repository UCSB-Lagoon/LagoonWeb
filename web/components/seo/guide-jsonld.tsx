/**
 * Structure pages emit their stored schemas. Guides retain breadcrumbs and
 * FAQs, but consolidate their legacy Article blocks using live frontmatter.
 */
export type GuideFrontmatter = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalPath: string;
  image: string;
  imageAlt: string;
  ogImageType: string;
  ogImageWidth: string;
  ogImageHeight: string;
  ogImageAlt: string;
  author: string;
  breadcrumbName: string;
  datePublished: string;
  dateModified: string;
  updatedLdDate: string;
  eyebrow: string;
  h1: string;
  updatedStamp: string;
  intro: string;
  metaPills: string[];
  related: { href: string; label: string }[];
  relatedCtaText: string;
  /**
   * Optional answer-first summary: who / what / when, with dates, in two or
   * three sentences an answer engine can quote. Rendered at the top of the
   * article and emitted as the Article's `abstract`. Facts only from the
   * repo's checked tables or the guide's own copy.
   */
  summary?: string;
};

/** Frontmatter owns the headline and dates; one Article describes each guide. */
export function guideSchema(blocks: unknown[], fm: GuideFrontmatter): unknown[] {
  const schemas = blocks as Record<string, unknown>[];
  const article = schemas.find((s) => s["@type"] === "Article") ?? {};
  return [
    ...schemas.filter((s) => s["@type"] !== "Article"),
    {
      ...article,
      "@context": "https://schema.org",
      "@type": "Article",
      headline: fm.title,
      description: fm.description,
      datePublished: fm.datePublished,
      dateModified: fm.dateModified,
      ...(fm.summary ? { abstract: fm.summary } : {}),
      mainEntityOfPage: `https://www.lagoonucsb.com${fm.canonicalPath}`,
      image: fm.image,
      author: { "@type": "Organization", name: fm.author || "Lagoon" },
      publisher: { "@type": "Organization", name: "Lagoon", url: "https://www.lagoonucsb.com/" },
    },
  ];
}

export function GuideJsonLd({ blocks }: { blocks: unknown[] }) {
  return (
    <>
      {blocks.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
