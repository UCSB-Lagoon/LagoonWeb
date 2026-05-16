#!/usr/bin/env node
/**
 * Extractor for the structure pages (/guides, /company) — they use the
 * shared site.css template (no bespoke inline CSS), so we only need the
 * body + JSON-LD + head metadata.
 *
 *   node scripts/migrate-page.mjs guides company
 *
 * Emits content/<slug>-body.html, content/<slug>.jsonld.json, and prints
 * the SEO-relevant head fields to wire into the route's Metadata.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const MKT = join(__dir, "..", "public", "marketing");
const OUT = join(__dir, "..", "content");

const m1 = (h, re) => (h.match(re) || [, ""])[1];

for (const slug of process.argv.slice(2)) {
  const html = await readFile(join(MKT, `${slug}.html`), "utf8");

  const blocks = [];
  for (const mm of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  )) {
    blocks.push(JSON.parse(mm[1].trim()));
  }
  await writeFile(
    join(OUT, `${slug}.jsonld.json`),
    JSON.stringify(blocks, null, 2) + "\n"
  );

  let body = html.split("</header>")[1].split("<footer>")[0];
  body = body.replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n").trim();
  await writeFile(join(OUT, `${slug}-body.html`), body + "\n");

  const meta = (p) =>
    m1(html, new RegExp(`<meta property="${p}" content="([^"]*)"`)) ||
    m1(html, new RegExp(`<meta name="${p}" content="([^"]*)"`));
  console.log(`\n=== ${slug} (${blocks.length} ld, body ${body.length}b) ===`);
  console.log(
    JSON.stringify(
      {
        title: m1(html, /<title>([^<]*)<\/title>/),
        description: m1(html, /name="description"\s*content="([^"]*)"/) ||
          m1(html, /name="description"[^>]*\n?\s*content="([^"]*)"/),
        canonical: m1(html, /rel="canonical" href="([^"]*)"/),
        ogTitle: meta("og:title"),
        ogDescription: meta("og:description"),
        ogImage: meta("og:image"),
        ogImageType: meta("og:image:type"),
        ogImageWidth: meta("og:image:width"),
        ogImageHeight: meta("og:image:height"),
        ogImageAlt: meta("og:image:alt"),
        twImageAlt: meta("twitter:image:alt"),
        author: meta("author"),
        keywords: meta("keywords"),
        themeColor: meta("theme-color"),
      },
      null,
      2
    )
  );
}
