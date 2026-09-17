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
    // .html is here because content/home-body.html is real, shipped markup —
    // the homepage body is injected from it. It was outside this walk, and it
    // had quietly kept a pocket of the retired identity alive: 34 literal
    // colours, among them #F08A3C and #1E1410, the old orange-500 and
    // warm-black. They rendered on the homepage every day while the guard
    // reported the brand clean, because the guard was only ever shown the
    // files the brand had already been migrated in.
    else if (/\.(tsx?|css|mdx|html)$/.test(name)) check(full);
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
    if (isGlobals && /(@theme(\s+static)?|^\.dark)\s*{/.test(line)) { inTheme = true; depth = 0; }
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
      // Inside a token block a hex is legal in exactly one shape: the
      // fallback of `var(--color-x, #hex)`. That shape is required — see
      // checkFallbacks() — and its value is verified against @theme there.
      // A bare hex is still a second definition of a colour @theme owns.
      const onlyFallbacks = line
        .replace(/var\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}\s*\)/g, "")
        .match(HEX);
      if (!onlyFallbacks) return;
      failures.push([rel, i + 1, line.trim(), "token block must reference @theme, not redefine a colour"]);
      return;
    }
    failures.push([rel, i + 1, line.trim(), "raw colour outside @theme"]);
  });
}

/**
 * site.css tokens carry a literal fallback: `var(--color-x, #hex)`.
 *
 * They have to. Tailwind tree-shakes @theme variables that no utility class
 * references, and the marketing routes are styled by site.css class names —
 * so on those routes the theme variables are absent and a bare `var(--color-x)`
 * resolves to nothing. That shipped once: /guides rendered black with no brand
 * at all, because every token in the file had become invalid at the same time.
 *
 * The fallback makes the page unbreakable. This check makes it honest — if a
 * fallback drifts from the @theme value it mirrors, the build fails, so there
 * is still exactly one source of truth.
 */
function checkFallbacks() {
  const g = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  const themeOf = (re) => {
    const m = g.match(re);
    if (!m) return {};
    let i = m.index + m[0].length, depth = 1;
    const start = i;
    while (i < g.length && depth) {
      if (g[i] === "{") depth++;
      else if (g[i] === "}") depth--;
      i++;
    }
    // Capture var() values too, not just literals. Skipping them is how a
    // circular token (`--x: var(--x)`) once slipped through: it left --x out
    // of the table, so every drift check against it was silently a no-op.
    return Object.fromEntries(
      [...g.slice(start, i).matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\))\s*;/g)]
        .map((x) => [x[1], x[2].toLowerCase()]),
    );
  };
  const themeRaw = themeOf(/@theme(?:\s+static)?\s*\{/);
  const darkRaw = { ...themeRaw, ...themeOf(/\n\.dark\s*\{/) };

  // Follow var() chains to a literal. A chain that loops or dangles is a hard
  // fail: CSS treats it as invalid, so every consumer silently drops to its
  // fallback — which is the LIGHT value, and the page inverts at night.
  const resolveIn = (table, label) => {
    const out = {};
    for (const key of Object.keys(table)) {
      let v = table[key], seen = new Set([key]), ok = true;
      while (v && v.startsWith("var(")) {
        const next = v.slice(4, -1);
        if (seen.has(next)) {
          failures.push(["app/globals.css", 0, `${key}: ${table[key]}`,
            `token chain loops in ${label} (${[...seen].join(" -> ")}) — CSS discards it`]);
          ok = false; break;
        }
        seen.add(next);
        if (!(next in table)) {
          failures.push(["app/globals.css", 0, `${key}: ${table[key]}`,
            `token chain dangles in ${label} (${next} is undefined) — CSS discards it`]);
          ok = false; break;
        }
        v = table[next];
      }
      if (ok && v) out[key] = v;
    }
    return out;
  };
  const theme = resolveIn(themeRaw, ":root");
  const dark = resolveIn(darkRaw, ".dark");

  const css = readFileSync(join(ROOT, "public/site.css"), "utf8");
  const blocks = [[":root", theme], [".dark", dark]];
  for (const [sel, table] of blocks) {
    const at = css.indexOf(`\n${sel} {`) + 1 || css.indexOf(`${sel} {`);
    let i = css.indexOf("{", at), depth = 0, end = i;
    while (end < css.length) {
      if (css[end] === "{") depth++;
      else if (css[end] === "}") { depth--; if (!depth) break; }
      end++;
    }
    for (const m of css.slice(i, end).matchAll(/(--[\w-]+):\s*var\((--[\w-]+),\s*(#[0-9a-fA-F]{3,8})\)/g)) {
      const [, name, ref, fallback] = m;
      const want = table[ref];
      if (want && want !== fallback.toLowerCase()) {
        failures.push(["public/site.css", 0, `${name}: var(${ref}, ${fallback})`,
          `fallback drifted from @theme ${ref} (${want})`]);
      }
    }
  }
}

/**
 * A site.css :root token that `.dark` does NOT override is theme-invariant by
 * construction — it is the same colour day and night. So it must not be built
 * out of a name that globals.css *does* flip.
 *
 * `--ink-light` broke exactly this way: cream ink meant for dark bands, defined
 * as `var(--color-cream-50)`. Inside `.dark` that name holds the navy ramp, so
 * every cream label on a navy band turned navy-on-navy — on any route where
 * Tailwind kept the variable. On marketing routes it tree-shook it away and the
 * literal fallback masked the bug, which is why nothing caught it for a week.
 */
function checkInvariantTokens() {
  const g = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  const dm = g.match(/\n\.dark\s*\{([\s\S]*?)\n\}/);
  if (!dm) return;
  const flips = new Set([...dm[1].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

  const css = readFileSync(join(ROOT, "public/site.css"), "utf8");
  const blockAfter = (sel) => {
    const at = css.indexOf(sel);
    if (at < 0) return "";
    let i = css.indexOf("{", at), depth = 0, end = i;
    while (end < css.length) {
      if (css[end] === "{") depth++;
      else if (css[end] === "}") { depth--; if (!depth) break; }
      end++;
    }
    return css.slice(i, end);
  };
  const root = blockAfter(":root {");
  const overridden = new Set([...blockAfter("\n.dark {").matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

  for (const m of root.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, val] = m;
    if (overridden.has(name)) continue;          // genuinely flips; .dark says so
    for (const r of val.matchAll(/var\((--[\w-]+)/g)) {
      if (flips.has(r[1])) {
        failures.push(["public/site.css", 0, `${name}: ${val.trim()}`,
          `theme-invariant token references ${r[1]}, which globals.css flips in .dark` +
          ` — it will change colour at night while its ground does not`]);
      }
    }
  }
}

for (const dir of ["app", "components", "lib", "content"]) {
  try { walk(join(ROOT, dir)); } catch {}
}
check(join(ROOT, "public/site.css"));
checkFallbacks();
checkInvariantTokens();

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
