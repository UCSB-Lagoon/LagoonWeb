#!/usr/bin/env node
/**
 * Body-content fidelity guard for the guide migration.
 *
 *   node scripts/content-check.mjs [baseUrl]
 *
 * The SEO harness only compares <head>. This makes sure no article PROSE
 * was dropped: it compares the visible <main> text of the original static
 * file vs the live (migrated) page as a word multiset, and reports words
 * that exist in the original but are missing from the migrated page.
 * Chrome differs by design (shared nav/footer) so we scope to <main>.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dir = dirname(fileURLToPath(import.meta.url));
const MKT = join(__dir, "..", "public", "marketing");
// Migrated slugs == the MDX files that exist.
const MIGRATED_GUIDE_SLUGS = (
  await readdir(join(__dir, "..", "content", "guides"))
)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => f.replace(/\.mdx$/, ""));
const base = process.argv[2] || "http://localhost:3000";

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/['"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

function bag(words) {
  const m = new Map();
  for (const w of words) m.set(w, (m.get(w) || 0) + 1);
  return m;
}

function mainText(html) {
  const $ = cheerio.load(html);
  $("script,style").remove();
  // Replace tags with spaces so adjacent cells/inline elements don't fuse
  // into bogus tokens (e.g. <td>want</td><td>pay</td> → "want pay").
  const inner = ($("main").html() || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ");
  return norm(inner);
}

let failed = 0;
for (const slug of MIGRATED_GUIDE_SLUGS) {
  const orig = mainText(await readFile(join(MKT, `${slug}.html`), "utf8"));
  const res = await fetch(`${base}/${slug}`);
  if (res.status !== 200) {
    console.log(`✗ ${slug}  HTTP ${res.status}`);
    failed++;
    continue;
  }
  const live = bag(mainText(await res.text()));
  const missing = [];
  for (const [w, n] of bag(orig)) {
    const have = live.get(w) || 0;
    if (have < n) missing.push(`${w}×${n - have}`);
  }
  if (missing.length > 3) {
    failed++;
    console.log(`✗ ${slug}  ${missing.length} missing: ${missing.slice(0, 20).join(" ")}`);
  } else {
    console.log(`✓ ${slug}${missing.length ? "  (minor: " + missing.join(" ") + ")" : ""}`);
  }
}
console.log(
  failed ? `\n${failed} page(s) lost content` : `\nAll ${MIGRATED_GUIDE_SLUGS.length} pages content-faithful`
);
process.exit(failed ? 1 : 0);
