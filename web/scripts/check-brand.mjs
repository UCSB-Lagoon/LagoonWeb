#!/usr/bin/env node
/**
 * Fails the build on a raw colour outside the one place colour is allowed to
 * be defined.
 *
 * This exists because of a specific, expensive failure. The brand used to be
 * defined in two files kept in sync by hand, `public/site.css` declared its
 * tokens FOUR times (the last one silently winning), and 162 colour values
 * lived in neither system. Repainting the site took four passes, and one of
 * them shipped a scale rename that detached 168 utility classes while the
 * build stayed green.
 *
 * A comment asking people to keep two files in sync is not a mechanism.
 * This is.
 *
 * Allowed:
 *   - `@theme` in app/globals.css — the single source of colour truth
 *   - the two token blocks in public/site.css, which may only hold var()
 *   - the allowlist below, each entry with a reason
 *
 * Run: node scripts/check-brand.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

/** Files that legitimately need a literal, and why. */
const ALLOW = [
  ["lib/email.ts",                 "mail clients strip CSS custom properties"],
  ["components/map/campus-map.tsx","Leaflet paints to canvas, which can't resolve var()"],
  ["app/manifest.ts",              "PWA manifest is browser chrome, not a mark"],
  ["scripts/check-brand.mjs",      "this file documents the hexes it forbids"],
];
/** Metadata keys that take a literal colour by spec. */
const ALLOWED_KEYS = /themeColor|theme_color|background_color/;

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|css|mdx)$/.test(name)) check(full);
  }
}

function check(file) {
  const rel = relative(ROOT, file);
  if (ALLOW.some(([p]) => rel === p)) return;

  const lines = readFileSync(file, "utf8").split("\n");
  const isGlobals = rel === "app/globals.css";
  const isSiteCss = rel === "public/site.css";
  let depth = 0, inTheme = false, inTokens = false, inComment = false;

  lines.forEach((line, i) => {
    // Track whether we're inside @theme (globals) or a token block (site.css),
    // the only regions where a literal is the point.
    // `.dark` redefines the same scale for the night surface — also a token
    // block, not a rule.
    if (isGlobals && /(@theme|^\.dark)\s*{/.test(line)) { inTheme = true; depth = 0; }
    if (isSiteCss && /^(:root|\.dark)\s*{/.test(line)) { inTokens = true; depth = 0; }
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    const wasInside = inTheme || inTokens;
    depth += opens - closes;
    if (wasInside && depth <= 0 && closes) { inTheme = false; inTokens = false; }

    // Track /* */ spans: a hex named in prose is documentation, not a value.
    // (The first version only skipped lines starting with `*`, which let the
    //  middle of a block comment through.)
    const opened = line.lastIndexOf("/*"), closed = line.lastIndexOf("*/");
    const startsComment = opened > closed;
    const wasComment = inComment;
    if (startsComment) inComment = true;
    else if (inComment && closed > opened) inComment = false;

    if (!HEX.test(line)) return;
    if (wasComment || startsComment) return;
    if (line.trimStart().startsWith("//")) return;
    if (ALLOWED_KEYS.test(line)) return;
    if (inTheme) return;                       // the source of truth
    if (isSiteCss && inTokens) {
      // A token block may hold rgba() alphas, but a hex here means a second
      // definition of a colour that @theme already owns.
      failures.push([rel, i + 1, line.trim(), "token block must reference @theme, not redefine a colour"]);
      return;
    }
    failures.push([rel, i + 1, line.trim(), "raw colour outside @theme"]);
  });
}

for (const dir of ["app", "components", "lib", "content"]) {
  try { walk(join(ROOT, dir)); } catch {}
}
check(join(ROOT, "public/site.css"));

if (failures.length) {
  console.error(`\n✗ ${failures.length} raw colour(s) outside app/globals.css @theme:\n`);
  for (const [f, n, text, why] of failures.slice(0, 25)) {
    console.error(`  ${f}:${n}  ${why}`);
    console.error(`     ${text.slice(0, 100)}`);
  }
  if (failures.length > 25) console.error(`  … and ${failures.length - 25} more`);
  console.error(`\n  Define it once in app/globals.css @theme and reference it.`);
  console.error(`  A genuine exception goes in ALLOW[] in this file, with its reason.\n`);
  process.exit(1);
}
console.log("✓ brand: every colour resolves from @theme");
