#!/usr/bin/env node
/**
 * One-shot extractor for the bespoke homepage.
 *
 * home.html is ~900 lines of hand-tuned CSS + ~530 lines of SVG-heavy
 * presentational markup with a scroll-reveal animation. Transcribing it
 * to JSX risks pixel regressions on the #1 page for no real gain (it has
 * no React state). So we keep the body as trusted static markup served
 * by an RSC route, and fold the CSS into site.css.
 *
 * Emits:
 *   content/home-body.html        — body sections (hero…download), nav/
 *                                   announce/footer removed (layout owns
 *                                   those), HTML comments stripped
 *   content/home.jsonld.json      — the 4 JSON-LD blocks, verbatim
 *   public/site.css  (appended)   — the inline <style>, under a HOME band
 */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, "..", "public", "marketing", "home.html");
const OUT = join(__dir, "..", "content");
const SITECSS = join(__dir, "..", "public", "site.css");

const html = await readFile(SRC, "utf8");

// 1. JSON-LD (verbatim, in order)
const blocks = [];
for (const m of html.matchAll(
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
)) {
  blocks.push(JSON.parse(m[1].trim()));
}
await writeFile(
  join(OUT, "home.jsonld.json"),
  JSON.stringify(blocks, null, 2) + "\n"
);

// 2. Inline CSS → append to site.css (idempotent: replace prior HOME band)
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const BAND_START = "/* ==== HOMEPAGE (ported from home.html) ==== */";
const BAND_END = "/* ==== END HOMEPAGE ==== */";
let site = await readFile(SITECSS, "utf8");
const bandRe = new RegExp(
  BAND_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    "[\\s\\S]*?" +
    BAND_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  "g"
);
site = site.replace(bandRe, "").trimEnd();
site += `\n\n${BAND_START}\n${css}\n${BAND_END}\n`;
await writeFile(SITECSS, site);

// 3. Body sections — between </nav> and <footer>, comments stripped
const afterNav = html.split("</nav>")[1];
let body = afterNav.split("<footer>")[0];
body = body.replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n").trim();
await writeFile(join(OUT, "home-body.html"), body + "\n");

console.log(
  `home: ${blocks.length} jsonld blocks, css ${css.length}b, body ${body.length}b`
);
