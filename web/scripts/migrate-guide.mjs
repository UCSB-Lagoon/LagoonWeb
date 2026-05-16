#!/usr/bin/env node
/**
 * Converts a static guide (public/marketing/<slug>.html) into
 * content/guides/<slug>.mdx (YAML frontmatter + markdown body).
 *
 *   node scripts/migrate-guide.mjs <slug> [<slug> ...]
 *
 * Standard guide template only (page-hero + article.article-card +
 * related-guides). FAQ pages are handled separately.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const __dir = dirname(fileURLToPath(import.meta.url));
const MKT = join(__dir, "..", "public", "marketing");
const OUT = join(__dir, "..", "content", "guides");

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});
td.use(gfm);

const hasClass = (n, c) =>
  typeof n.className === "string" && n.className.split(/\s+/).includes(c);

// .callout div → <Callout title="…">…</Callout>
td.addRule("callout", {
  filter: (n) => n.nodeName === "DIV" && hasClass(n, "callout"),
  replacement: (_c, node) => {
    const $$ = cheerio.load(node.outerHTML, { decodeEntities: false });
    const root = $$("div.callout").first();
    const title = txt(root.find("strong").first().text());
    root.find("strong").first().remove();
    const body = td.turndown(root.html() || "").trim();
    return `\n\n<Callout title="${title.replace(/"/g, "&quot;")}">\n\n${body}\n\n</Callout>\n\n`;
  },
});

// .faq-list div → <FaqList> of <FaqItem q="…">answer</FaqItem>
td.addRule("faqList", {
  filter: (n) => n.nodeName === "DIV" && hasClass(n, "faq-list"),
  replacement: (_c, node) => {
    const $$ = cheerio.load(node.outerHTML, { decodeEntities: false });
    const items = $$("details")
      .map((_, d) => {
        const $d = $$(d);
        const q = txt($d.find("summary").first().text()).replace(/"/g, "&quot;");
        $d.find("summary").first().remove();
        const a = td.turndown($d.html() || "").trim();
        const open = $d.attr("open") != null ? " open" : "";
        return `<FaqItem q="${q}"${open}>\n\n${a}\n\n</FaqItem>`;
      })
      .get()
      .join("\n\n");
    return `\n\n<FaqList>\n\n${items}\n\n</FaqList>\n\n`;
  },
});

// .article-links div → <ArticleLinks> with raw <a> children
td.addRule("articleLinks", {
  filter: (n) => n.nodeName === "DIV" && hasClass(n, "article-links"),
  replacement: (_c, node) => {
    const $$ = cheerio.load(node.outerHTML, { decodeEntities: false });
    const links = $$("a")
      .map((_, a) => {
        const rel = $$(a).attr("rel");
        return `  <a href="${$$(a).attr("href")}"${
          rel ? ` rel="${rel}"` : ""
        }>${txt($$(a).text())}</a>`;
      })
      .get()
      .join("\n");
    return `\n\n<ArticleLinks>\n${links}\n</ArticleLinks>\n\n`;
  },
});

const txt = (s) => (s || "").replace(/\s+/g, " ").trim();
const yaml = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function jsonBlocks($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    try {
      out.push({ data: JSON.parse(raw), updated: $(el).attr("data-lagoon-updated-ld") != null });
    } catch {}
  });
  return out;
}

async function migrate(slug) {
  const html = await readFile(join(MKT, `${slug}.html`), "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  const meta = (sel) => $(sel).attr("content");
  const blocks = jsonBlocks($);
  const article = blocks.find(
    (b) => b.data["@type"] === "Article" && b.data.headline
  )?.data;
  const updated = blocks.find(
    (b) => b.updated || (b.data["@type"] === "Article" && !b.data.headline)
  )?.data;

  const hero = $(".page-hero");
  const breadcrumbName = txt(hero.find(".breadcrumb span").last().text());
  const eyebrow = txt(hero.find(".eyebrow").first().text());
  const h1 = txt(hero.find("h1").first().text());
  const updatedStamp = txt(hero.find(".updated-stamp").first().text());
  // intro = first <p> in hero that isn't eyebrow/updated-stamp
  let intro = "";
  hero.find("p").each((_, p) => {
    const $p = $(p);
    if (intro) return;
    if ($p.hasClass("eyebrow") || $p.hasClass("updated-stamp")) return;
    intro = txt($p.text());
  });
  const metaPills = hero
    .find(".article-meta .meta-pill")
    .map((_, e) => txt($(e).text()))
    .get();

  const relWrap = $(".related-guides");
  const related = relWrap
    .find(".related-guides-list a")
    .map((_, a) => ({ href: $(a).attr("href"), label: txt($(a).text()) }))
    .get();
  const ctaClone = relWrap.find(".related-guides-cta").clone();
  ctaClone.find("a").remove();
  const relatedCtaText = txt(ctaClone.text());

  // Body = everything in <main> except the hero + related-guides (those
  // are template/frontmatter). Captures the article-card AND any extra
  // sections (e.g. the FAQ section that sits after </article>).
  const mainEl = $("main").clone();
  mainEl.find(".page-hero, .related-guides").remove();
  mainEl.find("h1").remove(); // hero already has the h1
  const body = td
    .turndown(mainEl.html() || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const fm = {
    title: $("title").text().trim(),
    description: meta('meta[name="description"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    canonicalPath: new URL($('link[rel="canonical"]').attr("href")).pathname,
    image: meta('meta[property="og:image"]') || "https://lagoonucsb.com/og-card.png",
    imageAlt:
      meta('meta[name="twitter:image:alt"]') || $("title").text().trim(),
    // Some originals carry og:image dimensions, some only og:image. Capture
    // verbatim so the migrated page matches whichever the page had.
    ogImageType: meta('meta[property="og:image:type"]') || "",
    ogImageWidth: meta('meta[property="og:image:width"]') || "",
    ogImageHeight: meta('meta[property="og:image:height"]') || "",
    ogImageAlt: meta('meta[property="og:image:alt"]') || "",
    author: meta('meta[name="author"]') || "",
    breadcrumbName,
    datePublished: article?.datePublished || "",
    dateModified: article?.dateModified || "",
    updatedLdDate: updated?.dateModified || "",
    eyebrow,
    h1,
    updatedStamp,
    intro,
    metaPills,
    related,
    relatedCtaText,
  };

  const front = [
    "---",
    `title: ${yaml(fm.title)}`,
    `description: ${yaml(fm.description)}`,
    `ogTitle: ${yaml(fm.ogTitle)}`,
    `ogDescription: ${yaml(fm.ogDescription)}`,
    `canonicalPath: ${yaml(fm.canonicalPath)}`,
    `image: ${yaml(fm.image)}`,
    `imageAlt: ${yaml(fm.imageAlt)}`,
    `ogImageType: ${yaml(fm.ogImageType)}`,
    `ogImageWidth: ${yaml(fm.ogImageWidth)}`,
    `ogImageHeight: ${yaml(fm.ogImageHeight)}`,
    `ogImageAlt: ${yaml(fm.ogImageAlt)}`,
    `author: ${yaml(fm.author)}`,
    `breadcrumbName: ${yaml(fm.breadcrumbName)}`,
    `datePublished: ${yaml(fm.datePublished)}`,
    `dateModified: ${yaml(fm.dateModified)}`,
    `updatedLdDate: ${yaml(fm.updatedLdDate)}`,
    `eyebrow: ${yaml(fm.eyebrow)}`,
    `h1: ${yaml(fm.h1)}`,
    `updatedStamp: ${yaml(fm.updatedStamp)}`,
    `intro: ${yaml(fm.intro)}`,
    "metaPills:",
    ...fm.metaPills.map((p) => `  - ${yaml(p)}`),
    "related:",
    ...fm.related.map(
      (r) => `  - { href: ${yaml(r.href)}, label: ${yaml(r.label)} }`
    ),
    `relatedCtaText: ${yaml(fm.relatedCtaText)}`,
    "---",
    "",
  ].join("\n");

  // Emit the original JSON-LD blocks VERBATIM (parsed → restringified) so
  // schema is byte-faithful regardless of shape (full vs lean vs FAQPage).
  await writeFile(
    join(OUT, `${slug}.jsonld.json`),
    JSON.stringify(blocks.map((b) => b.data), null, 2) + "\n"
  );

  await writeFile(join(OUT, `${slug}.mdx`), front + body + "\n");
  console.log(
    `✓ ${slug}  (pills:${fm.metaPills.length} related:${fm.related.length} body:${body.length}b)`
  );
}

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("usage: migrate-guide.mjs <slug> ...");
  process.exit(2);
}
for (const s of slugs) await migrate(s);
