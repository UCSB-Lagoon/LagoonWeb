#!/usr/bin/env node
/**
 * SEO regression harness for the marketing → JSX/MDX migration.
 *
 *   node scripts/seo-snapshot.mjs snapshot [baseUrl]   # write goldens
 *   node scripts/seo-snapshot.mjs check    [baseUrl]   # diff vs goldens, exit 1 on drift
 *
 * Captures the SEO-load-bearing parts of each marketing page's <head> —
 * title, meta (description/keywords/robots/og/twitter/apple), canonical +
 * hreflang, and every JSON-LD block (parsed & key-sorted so reordering is
 * not a false diff). Deliberately ignores <script> GA/analytics tags and
 * page body: those legitimately change in the migration, SEO must not.
 *
 * Goldens are captured from the current static pages BEFORE migration and
 * are the oracle every later phase is checked against.
 */
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(__dir, "seo-golden");

// Inline the slug list (plain .mjs can't import the .ts source cleanly).
const HOME = "/";
const SLUGS = [
  "best-apps-for-ucsb-students","best-dorms-at-ucsb","best-study-spots-at-ucsb",
  "company","guides","how-lagoon-dining-works","how-lagoon-schedule-works",
  "how-to-choose-classes-at-ucsb","how-to-meet-people-at-ucsb",
  "how-to-plan-your-ucsb-schedule","how-to-use-gold-at-ucsb",
  "isla-vista-guide-for-students","ucsb-campus-events-guide","ucsb-dining-menu",
  "ucsb-dorm-faq","ucsb-finals-week-guide","ucsb-first-week-guide",
  "ucsb-freshman-faq","ucsb-ge-requirements-guide","ucsb-grade-distributions-guide",
  "ucsb-meal-plan-guide","ucsb-move-in-checklist","ucsb-orientation-checklist",
  "ucsb-registration-guide","ucsb-transfer-student-guide","what-to-bring-to-ucsb-dorm",
  "what-to-do-between-classes-at-ucsb",
];
const PATHS = [HOME, ...SLUGS.map((s) => `/${s}`)];
const nameFor = (p) => (p === "/" ? "home" : p.replace(/^\//, ""));

// Decode HTML entities so "&#x27;" === "'" — entity encoding is not an
// SEO difference (crawlers decode it), and React/Next will encode where
// hand-written HTML used a literal char.
function decode(s) {
  if (s == null) return s;
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i")) ||
            tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? m[1] : null;
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  }
  return v;
}

// Non-SEO metas that legitimately differ between hand-written HTML and
// Next's generated head (e.g. "initial-scale=1.0" vs "1"). Dropped from
// BOTH golden and actual before diffing — not SEO-load-bearing.
const IGNORE_METAS = new Set(["viewport"]);

function extract(html) {
  const head = (html.match(/<head[\s\S]*?<\/head>/i) || [html])[0];

  const title = decode((head.match(/<title>([\s\S]*?)<\/title>/i) || [, null])[1]);

  const metas = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = attr(tag, "name") || attr(tag, "property");
    const val = decode(attr(tag, "content"));
    if (key && !IGNORE_METAS.has(key.toLowerCase())) {
      metas[key.toLowerCase()] = val;
    }
  }

  const links = {};
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = (attr(tag, "rel") || "").toLowerCase();
    if (rel === "canonical") links.canonical = attr(tag, "href");
    if (rel === "alternate") {
      (links.alternate ||= []).push({
        hreflang: attr(tag, "hreflang"),
        href: attr(tag, "href"),
      });
    }
  }

  // JSON-LD is valid (and Google-supported) anywhere in the document —
  // migrated pages emit it in <body>. Scan the whole HTML, not just head.
  const jsonld = [];
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      jsonld.push(sortKeys(JSON.parse(m[1].trim())));
    } catch {
      jsonld.push({ __unparseable__: m[1].trim().slice(0, 120) });
    }
  }
  // Order-independent
  jsonld.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  return { title, metas, links, jsonld };
}

async function fetchPage(base, p) {
  const res = await fetch(base + p, { redirect: "manual" });
  if (res.status !== 200) {
    throw new Error(`${p} → HTTP ${res.status}`);
  }
  return extract(await res.text());
}

function diff(a, b, path = "") {
  const out = [];
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja === jb) return out;
  if (a && b && typeof a === "object" && typeof b === "object" &&
      !Array.isArray(a) && !Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      out.push(...diff(a[k], b[k], path ? `${path}.${k}` : k));
    }
  } else {
    out.push(`${path}\n   golden: ${JSON.stringify(a)}\n   actual: ${JSON.stringify(b)}`);
  }
  return out;
}

const [, , mode = "snapshot", base = "http://localhost:3000"] = process.argv;

if (mode === "snapshot") {
  await mkdir(GOLDEN_DIR, { recursive: true });
  for (const p of PATHS) {
    const data = await fetchPage(base, p);
    await writeFile(join(GOLDEN_DIR, `${nameFor(p)}.json`),
      JSON.stringify(data, null, 2) + "\n");
    console.log("captured", p);
  }
  console.log(`\n${PATHS.length} goldens written to scripts/seo-golden/`);
} else if (mode === "check") {
  if (!existsSync(GOLDEN_DIR) || (await readdir(GOLDEN_DIR)).length === 0) {
    console.error("No goldens. Run `snapshot` against the pre-migration build first.");
    process.exit(2);
  }
  let failed = 0;
  for (const p of PATHS) {
    const goldenPath = join(GOLDEN_DIR, `${nameFor(p)}.json`);
    if (!existsSync(goldenPath)) { console.log("∅ no golden", p); continue; }
    const golden = JSON.parse(await readFile(goldenPath, "utf8"));
    // Goldens captured before IGNORE_METAS existed may still carry them.
    if (golden.metas) for (const k of IGNORE_METAS) delete golden.metas[k];
    let actual;
    try { actual = await fetchPage(base, p); }
    catch (e) { console.log(`✗ ${p}  (${e.message})`); failed++; continue; }
    const d = diff(golden, actual);
    if (d.length) {
      failed++;
      console.log(`\n✗ ${p}`);
      for (const line of d) console.log("  " + line);
    } else {
      console.log(`✓ ${p}`);
    }
  }
  console.log(failed ? `\n${failed} page(s) drifted` : `\nAll ${PATHS.length} pages match goldens`);
  process.exit(failed ? 1 : 0);
} else {
  console.error(`Unknown mode "${mode}" (use snapshot|check)`);
  process.exit(2);
}
