/**
 * Emits a guide's JSON-LD blocks verbatim from the captured originals
 * (content/guides/<slug>.jsonld.json), so structured data is byte-faithful
 * regardless of shape — full Article, lean Article, or FAQPage. The
 * blocks were extracted from the static pages by scripts/migrate-guide.mjs.
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
};

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
