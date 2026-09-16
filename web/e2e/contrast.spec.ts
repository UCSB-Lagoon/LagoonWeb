import { test, expect, type Page } from "@playwright/test";

/**
 * WCAG AA contrast, measured on the rendered page.
 *
 * Every real bug in the 2026-09 repaint was of this shape: two perfectly legal
 * brand tokens put together at 1.3:1. A linter cannot see it — both sides are
 * valid — so it has to be measured after paint.
 *
 * Two lessons are baked in, both of which produced false results first time:
 *
 *  1. **Only visible text counts.** Measuring everything counted the closed
 *     hamburger menu and reported a readable nav at 1.23:1.
 *  2. **Measure in the real page, not a detached iframe.** Backgrounds don't
 *     resolve there, and it reported nonsense for the same nav.
 */

const ROUTES = ["/", "/hub", "/stats", "/leaderboard", "/captains", "/guides", "/company"];

/** Pairings that are known-failing and tracked, not silently tolerated. */
const KNOWN: Array<{ route: string; text: string; why: string }> = [];

type Fail = { text: string; ratio: number; need: number; selector: string };

async function contrastFailures(page: Page): Promise<Fail[]> {
  return page.evaluate(() => {
    // Colours are normalised by painting them, not by parsing the string.
    //
    // Tailwind v4 emits `oklab(...)` and `oklch(...)`, and a naive
    // `match(/[\d.]+/g)` reads `oklab(0.958 0.0004 0.0098 / 0.8)` as
    // rgb(0.958, 0.0004, 0.0098) — i.e. black. That one bug reported a
    // perfectly readable navy-on-cream wordmark at 1.23:1 and sent three
    // separate investigations down the wrong path. The canvas resolves any
    // colour space the browser understands, including alpha.
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    const cache = new Map<string, [number, number, number, number]>();

    const rgba = (css: string): [number, number, number, number] => {
      const hit = cache.get(css);
      if (hit) return hit;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = css;                 // invalid input leaves it #000
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      const out: [number, number, number, number] = [d[0], d[1], d[2], d[3] / 255];
      cache.set(css, out);
      return out;
    };

    /** Composite a translucent colour over an opaque one. */
    const over = (fg: [number, number, number, number], bg: [number, number, number]) =>
      [0, 1, 2].map((i) => fg[3] * fg[i] + (1 - fg[3]) * bg[i]) as [number, number, number];

    const lum = ([r, g, b]: [number, number, number]) => {
      const f = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: [number, number, number], b: [number, number, number]) => {
      const [x, y] = [lum(a), lum(b)];
      return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2));
    };

    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      let p: Element | null = el;
      while (p && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
        p = p.parentElement;
      }
      return true;
    };
    const path = (el: Element) => {
      const bits: string[] = [];
      let p: Element | null = el;
      for (let i = 0; p && i < 3; i++, p = p.parentElement) {
        bits.unshift(p.tagName.toLowerCase() + (p.className ? "." + String(p.className).split(/\s+/)[0] : ""));
      }
      return bits.join(">");
    };

    /** Walk up compositing every translucent layer down to one opaque colour. */
    const backdrop = (el: Element): [number, number, number] => {
      const layers: [number, number, number, number][] = [];
      let p: Element | null = el;
      while (p && p !== document.documentElement) {
        const c = rgba(getComputedStyle(p).backgroundColor);
        if (c[3] > 0) {
          layers.push(c);
          if (c[3] >= 0.999) break;        // opaque: nothing below it shows
        }
        p = p.parentElement;
      }
      const base = rgba(getComputedStyle(document.documentElement).backgroundColor);
      let acc: [number, number, number] = base[3] > 0 ? [base[0], base[1], base[2]] : [255, 255, 255];
      for (const l of layers.reverse()) acc = over(l, acc);
      return acc;
    };

    const out: Fail[] = [];
    document.querySelectorAll("a,button,span,p,div,h1,h2,h3,h4,li,td,th,label").forEach((el) => {
      if (el.children.length) return;                  // leaf text only
      const text = el.textContent?.trim() ?? "";
      if (!text || text.length > 80) return;
      if (!visible(el)) return;

      const cs = getComputedStyle(el);
      const bg = backdrop(el);
      const fg = over(rgba(cs.color), bg);             // text may be translucent too
      const r = ratio(fg, bg);
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (r < need - 0.05) out.push({ text: text.slice(0, 40), ratio: r, need, selector: path(el) });
    });
    return out;
  });
}

for (const route of ROUTES) {
  for (const theme of ["light", "dark"] as const) {
    test(`contrast · ${route} · ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem("theme", t); } catch {}
      }, theme);
      await page.goto(route, { waitUntil: "networkidle" });
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);

      const fails = (await contrastFailures(page)).filter(
        (f) => !KNOWN.some((k) => k.route === route && f.text.startsWith(k.text)),
      );

      expect(
        fails,
        fails.map((f) => `  ${f.ratio}:1 (needs ${f.need}) — "${f.text}"  ${f.selector}`).join("\n"),
      ).toEqual([]);
    });
  }
}
