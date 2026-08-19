import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MIGRATED_GUIDE_SLUGS } from "@/lib/marketing-slugs";

/**
 * Lightweight build-time index of the guide library.
 *
 * The guides' full frontmatter is parsed by next-mdx-remote when a guide
 * page renders, but two places need only a few scalar fields across ALL
 * guides at once — the sitemap (per-guide lastModified) and the /guides
 * ItemList JSON-LD. Compiling 29 MDX documents for that would be wasteful,
 * so this reads just the frontmatter block with a small scanner.
 *
 * Only flat `key: "value"` pairs are read; nested/list keys (metaPills,
 * related) are ignored, which is all these callers need.
 */
export type GuideSummary = {
  slug: string;
  title: string;
  description: string;
  breadcrumbName: string;
  datePublished: string;
  dateModified: string;
};

const WANTED = [
  "title",
  "description",
  "breadcrumbName",
  "datePublished",
  "dateModified",
] as const;

function parseFrontmatter(source: string): Record<string, string> {
  const end = source.indexOf("\n---", 3);
  if (!source.startsWith("---") || end === -1) return {};

  const out: Record<string, string> = {};
  for (const line of source.slice(3, end).split("\n")) {
    // Flat scalars only — indented lines belong to a nested key.
    if (/^\s/.test(line)) continue;
    const match = /^([A-Za-z][\w]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!(WANTED as readonly string[]).includes(key)) continue;
    out[key] = rawValue.trim().replace(/^"(.*)"$/s, "$1");
  }
  return out;
}

let cache: Promise<GuideSummary[]> | null = null;

/** All guides, in the order they appear in MIGRATED_GUIDE_SLUGS. */
export function getGuideIndex(): Promise<GuideSummary[]> {
  cache ??= Promise.all(
    MIGRATED_GUIDE_SLUGS.map(async (slug) => {
      const source = await readFile(
        join(process.cwd(), "content", "guides", `${slug}.mdx`),
        "utf8"
      );
      const fm = parseFrontmatter(source);
      return {
        slug,
        title: fm.title ?? slug,
        description: fm.description ?? "",
        breadcrumbName: fm.breadcrumbName ?? fm.title ?? slug,
        datePublished: fm.datePublished ?? "",
        dateModified: fm.dateModified ?? fm.datePublished ?? "",
      };
    })
  );
  return cache;
}
