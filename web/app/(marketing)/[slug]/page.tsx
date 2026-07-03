import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { MIGRATED_GUIDE_SLUGS } from "@/lib/marketing-slugs";
import { GuideJsonLd, type GuideFrontmatter } from "@/components/seo/guide-jsonld";
import { GuideShell } from "@/components/marketing/guide-shell";
import { mdxComponents } from "@/components/marketing/mdx";

// Only the slugs ported so far are served here; everything else is still
// a static-HTML rewrite (next.config.ts). Unknown slugs 404 rather than
// attempting a dynamic render.
export const dynamicParams = false;

export function generateStaticParams() {
  return MIGRATED_GUIDE_SLUGS.map((slug) => ({ slug }));
}

async function loadGuide(slug: string) {
  let source: string;
  try {
    source = await readFile(
      join(process.cwd(), "content", "guides", `${slug}.mdx`),
      "utf8"
    );
  } catch {
    notFound();
  }
  return compileMDX<GuideFrontmatter>({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      // GFM so the guides' markdown tables render as <table> instead of
      // literal pipe characters (they were authored as GFM).
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { frontmatter: fm } = await loadGuide(slug);
  const url = `https://lagoonucsb.com${fm.canonicalPath}`;
  // Faithful to the original: some pages had og:image dimensions, some
  // only og:image.
  const ogImages = fm.ogImageWidth
    ? [
        {
          url: fm.image,
          type: fm.ogImageType || undefined,
          width: Number(fm.ogImageWidth),
          height: Number(fm.ogImageHeight),
          alt: fm.ogImageAlt || undefined,
        },
      ]
    : [fm.image];
  return {
    title: { absolute: fm.title },
    description: fm.description,
    ...(fm.author ? { authors: [{ name: fm.author }] } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: fm.ogTitle,
      description: fm.ogDescription,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.ogDescription,
      images: [{ url: fm.image, alt: fm.imageAlt }],
    },
  };
}

export default async function GuidePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { content, frontmatter: fm } = await loadGuide(slug);
  const blocks = JSON.parse(
    await readFile(
      join(process.cwd(), "content", "guides", `${slug}.jsonld.json`),
      "utf8"
    )
  ) as unknown[];
  return (
    <>
      <GuideJsonLd blocks={blocks} />
      <GuideShell fm={fm}>{content}</GuideShell>
    </>
  );
}
