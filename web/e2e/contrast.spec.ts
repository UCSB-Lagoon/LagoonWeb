import { test, expect, type Page } from "@playwright/test";
import { MD_CLASS } from "../lib/mini-markdown";

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

/**
 * `root` scopes the sweep to a subtree, for surfaces that have no reachable
 * route and must be mounted instead of navigated to.
 *
 * `nonText` adds a second sweep for the two rules a text walk structurally
 * cannot see: a `::marker` colour and a `text-decoration-color` are not text
 * nodes, so `getComputedStyle(el).color` never reports them. It is opt-in
 * because it is only wired up where the markup under test relies on them.
 */
async function contrastFailures(
  page: Page,
  opts: { root?: string; nonText?: boolean } = {},
): Promise<Fail[]> {
  return page.evaluate(({ root, nonText }) => {
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
        // Not exposed to assistive tech, so the contrast rule does not apply —
        // this is the same exclusion axe makes.
        //
        // It is also the one exclusion here that could be abused: anything can
        // be silenced by hiding it. Treat a new aria-hidden over failing text
        // as a fix only when the text is genuinely decorative AND still legible
        // to a sighted reader. Both current users (the marquee, the phone
        // mockup) had their colours corrected as well, not instead.
        if (p.getAttribute("aria-hidden") === "true") return false;
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
    const scope = document.querySelector(root) ?? document.body;
    scope.querySelectorAll("a,button,span,p,div,h1,h2,h3,h4,li,td,th,label,blockquote,code,strong,em").forEach((el) => {
      if (el.children.length) return;                  // leaf text only
      const text = el.textContent?.trim() ?? "";
      if (!text || text.length > 80) return;
      if (!visible(el)) return;
      // An emoji paints from its own colour font; `color` does not apply to it.
      // Measuring one compares a colour that was never used against the
      // background and reports nonsense — a 🗓️ on a navy card came back at
      // 1.01:1. Skip leaves that are entirely pictographic.
      if (!/[\p{L}\p{N}]/u.test(text)) return;

      const cs = getComputedStyle(el);
      const bg = backdrop(el);
      const fg = over(rgba(cs.color), bg);             // text may be translucent too
      const r = ratio(fg, bg);
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (r < need - 0.05) out.push({ text: text.slice(0, 40), ratio: r, need, selector: path(el) });
    });

    // Non-text contrast (WCAG 1.4.11) — a rule that identifies a link, or a
    // bullet that identifies a list, has to be visible against what it sits on.
    if (nonText) {
      const rule = (el: Element, colour: string, what: string) => {
        const bg = backdrop(el);
        const r = ratio(over(rgba(colour), bg), bg);
        if (r < 3 - 0.05) out.push({ text: what, ratio: r, need: 3, selector: path(el) });
      };
      document.querySelectorAll("*").forEach((el) => {
        if (!visible(el)) return;
        const cs = getComputedStyle(el);
        if (cs.listStyleType !== "none" && el.tagName === "LI") {
          rule(el, getComputedStyle(el, "::marker").color, "::marker");
        }
        if (cs.textDecorationLine.includes("underline")) {
          rule(el, cs.textDecorationColor, "underline rule");
        }
        if (cs.borderLeftStyle !== "none" && parseFloat(cs.borderLeftWidth) >= 3) {
          rule(el, cs.borderLeftColor, "left rule");
        }
      });
    }
    return out;
  }, { root: opts.root ?? "body", nonText: !!opts.nonText });
}

/**
 * Navigate, and refuse to measure anything that is not a real 200.
 *
 * Without this the suite grades Next's error page and calls it a pass. That
 * is not hypothetical: with no Supabase env — which is exactly what CI has —
 * `/hub`, `/stats`, `/leaderboard` and `/captains` all return 500, and all
 * eight of those tests passed anyway, because an error page is dark text on
 * a white ground and clears AA comfortably.
 *
 * Same failure as the dev-server one this suite was built to fix: the
 * measurement was fine, the thing being measured was not the app. A contrast
 * suite has to assert what it is looking at.
 */
async function goto(page: Page, route: string) {
  const res = await page.goto(route, { waitUntil: "networkidle" });
  expect(res, `no response for ${route}`).not.toBeNull();
  expect(res!.status(), `${route} did not render — measuring an error page proves nothing`)
    .toBe(200);
}

for (const route of ROUTES) {
  for (const theme of ["light", "dark"] as const) {
    test(`contrast · ${route} · ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem("theme", t); } catch {}
      }, theme);
      await goto(page, route);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);

      // Reveal the page before measuring it.
      //
      // The marketing pages enter on scroll: `.r/.rl/.rr` sit at `opacity: 0`
      // until an IntersectionObserver adds `.on`. `visible()` — correctly —
      // refuses to measure a transparent element, so at the default scroll
      // position everything below the fold was silently skipped. The suite was
      // only ever measuring the hero and the nav, on the one page with the most
      // content. Three failing pairings on the navy guides band, one of them a
      // 2.97:1 eyebrow, sat under that gap.
      //
      // Scrolling first drives the real observers; forcing `.on` afterwards
      // catches anything whose observer did not fire in a headless viewport.
      // Kill transitions FIRST. `.on` only starts a fade to opacity 1, and
      // `visible()` skips anything still at 0 — so on a fast machine the
      // sample landed mid-fade and those elements were quietly dropped from
      // the run. That is a test that gets weaker the faster it goes: two
      // consecutive runs of this file disagreed about a 4.34:1 map label,
      // one measuring it and one skipping it. Frozen, the reveal is instant
      // and every run measures the same set.
      await page.addStyleTag({
        content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
      });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => r(null)));
        }
        window.scrollTo(0, 0);
        document.querySelectorAll(".r,.rl,.rr").forEach((e) => e.classList.add("on"));
      });
      await page.waitForTimeout(250);

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


/* ──────────────────────────────────────────────────────────────────────────
 * /admin/handbook — the route the sweep above cannot reach.
 *
 * It redirects to /login for anyone unauthenticated, so there is no rendered
 * page to measure and no honest way to add it to ROUTES. What decides the
 * answer is only two things, and both can be reconstructed: the class strings
 * lib/mini-markdown.tsx ships, and the surfaces it puts them on. The strings
 * are IMPORTED from the renderer, never copied — a copy would go stale the
 * first time someone edited one, and this suite would then prove nothing while
 * staying green.
 *
 * The fixture is injected into a real app route so @theme resolves through the
 * same compiled stylesheet the handbook loads, and so `.card` is the real card
 * — in `.dark` that is `--color-navy-700`, an override the token alone doesn't
 * tell you about.
 *
 * Every nesting below exists because it changes the backdrop. A link is fine
 * on the card and has to survive the `cream-100` under a blockquote and a
 * table head, and the `cream-100/40` of an even row — `--gold-ink` is 5.07:1
 * on the card but 4.10:1 on `cream-100`, which is exactly why the link text
 * here is ink and only its underline is gold.
 * ────────────────────────────────────────────────────────────────────────── */
const HANDBOOK_FIXTURE = `
  <div class="app-shell">
    <article class="card p-6 sm:p-10">
      <p class="my-3 text-ink-700 leading-relaxed">Body copy on the card surface.</p>
      <p class="my-3 text-ink-700 leading-relaxed"><a class="${MD_CLASS.link}">Inline link on the card</a></p>
      <blockquote class="${MD_CLASS.blockquote}">Quoted text on the tinted fill.</blockquote>
      <blockquote class="${MD_CLASS.blockquote}"><a class="${MD_CLASS.link}">Inline link inside a blockquote</a></blockquote>
      <ul class="${MD_CLASS.list}"><li class="my-1 text-ink-700">List item, gold marker</li></ul>
      <table class="w-full text-sm border border-cream-200 rounded-xl overflow-hidden">
        <thead class="bg-cream-100">
          <tr><th class="text-left font-semibold text-ink-900 px-3 py-2 border-b border-cream-200"><a class="${MD_CLASS.link}">Link in a table head</a></th></tr>
        </thead>
        <tbody>
          <tr class="even:bg-cream-100/40"><td class="px-3 py-2 border-b border-cream-200 text-ink-700 align-top">Odd row</td></tr>
          <tr class="even:bg-cream-100/40"><td class="px-3 py-2 border-b border-cream-200 text-ink-700 align-top"><a class="${MD_CLASS.link}">Link in an even row</a></td></tr>
        </tbody>
      </table>
    </article>
  </div>`;

for (const theme of ["light", "dark"] as const) {
  test(`contrast · /admin/handbook markdown (synthetic) · ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => {
      try { localStorage.setItem("theme", t); } catch {}
    }, theme);
    await goto(page, "/hub");
    await page.evaluate(({ t, html }) => {
      document.documentElement.classList.toggle("dark", t === "dark");
      document.body.innerHTML = html;
    }, { t: theme, html: HANDBOOK_FIXTURE });

    const fails = await contrastFailures(page, { nonText: true });
    expect(
      fails,
      fails.map((f) => `  ${f.ratio}:1 (needs ${f.need}) — "${f.text}"  ${f.selector}`).join("\n"),
    ).toEqual([]);
  });
}

/**
 * The token half of the same question: the pairing above is only safe because
 * both sides flip. `bg-orange-50/50` is the bug this guards — a fill that
 * stays light while the ink turns cream, which read at 1.64:1 at night.
 *
 * Asserting "different in .dark" rather than a literal keeps @theme the single
 * source of colour; the literals stay in globals.css where check-brand.mjs can
 * see them.
 */
test("contrast · handbook tokens flip with the theme", async ({ page }) => {
  await goto(page, "/hub");
  const read = (dark: boolean) =>
    page.evaluate((d) => {
      document.documentElement.classList.toggle("dark", d);
      const cs = getComputedStyle(document.documentElement);
      const card = document.createElement("div");
      card.className = "card";
      document.body.appendChild(card);
      const surface = getComputedStyle(card).backgroundColor;
      card.remove();
      return {
        surface,
        "--color-cream-100": cs.getPropertyValue("--color-cream-100").trim(),
        "--color-gold-700": cs.getPropertyValue("--color-gold-700").trim(),
        "--color-ink-900": cs.getPropertyValue("--color-ink-900").trim(),
        "--color-ink-700": cs.getPropertyValue("--color-ink-700").trim(),
      };
    }, dark);

  const light = await read(false);
  const dark = await read(true);
  for (const key of Object.keys(light) as Array<keyof typeof light>) {
    expect(dark[key], `${key} is the same day and night — it cannot be carrying a themed surface`)
      .not.toBe(light[key]);
  }
});

/**
 * Semantic status tokens, measured on a real page.
 *
 * These four ladders have no route this suite can reach. Every consumer is
 * either behind the /admin auth redirect — all four admin paths answer 307 to
 * /login, so adding them to ROUTES would measure the login page four more
 * times, not a single badge — or inside a data-dependent branch: an empty
 * database renders the empty state instead of the badges, and the error boxes
 * need a failed submit. `warning` has no consumer at all yet. Confirmed by
 * grepping the rendered HTML of every reachable route for a status class:
 * zero hits.
 *
 * So the surfaces are mounted instead of navigated to. That keeps the lesson
 * the route tests are built on — measure in the real page, never a detached
 * iframe — because this IS the real page: real stylesheet, real cascade, real
 * `.dark` toggle on <html>. Only the markup is synthetic; nothing about how
 * the colour resolves is.
 *
 * Inline `var(--color-*)` rather than utility classes, deliberately. Tailwind
 * only emits a utility that some source file references, so `bg-warning-100`
 * is genuinely absent from the bundle while `--color-warning-100` is present
 * (`@theme static` emits every variable). The tokens are what is under test,
 * so the tokens are what this references — and it therefore also fails if a
 * token is deleted or misnamed, which a utility class would mask by silently
 * resolving to nothing.
 */
const STATUS_TOKENS = ["success", "warning", "danger", "info"] as const;

/** Every ground a status ink can land on. Worst case is a plate or cream-100. */
const STATUS_GROUNDS: Array<[string, string]> = [
  ["plate-50", "--color-{}-50"],
  ["plate-100", "--color-{}-100"],
  ["card-tinted", "--color-cream-100"],
  ["page", "--color-cream-50"],
  ["panel", "--color-panel"],
  ["card", "--color-panel-elevated"],
];

for (const theme of ["light", "dark"] as const) {
  test(`contrast · status tokens · ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => {
      try { localStorage.setItem("theme", t); } catch {}
    }, theme);
    // Any app-shell route will do; the tokens live on :root / .dark.
    await goto(page, "/hub");
    await page.evaluate((t) => {
      document.documentElement.classList.toggle("dark", t === "dark");
    }, theme);

    await page.evaluate(
      ({ statuses, grounds }) => {
        const host = document.createElement("div");
        host.id = "status-token-matrix";
        for (const s of statuses) {
          for (const [label, groundVar] of grounds) {
            const cell = document.createElement("div");
            cell.style.background = `var(${groundVar.replace("{}", s)})`;
            cell.style.padding = "8px";
            const leaf = document.createElement("span");
            // The real badge: 10px, 700. Under 18.66px, so it needs 4.5:1.
            leaf.style.color = `var(--color-${s}-ink)`;
            leaf.style.fontSize = "10px";
            leaf.style.fontWeight = "700";
            leaf.textContent = `${s} on ${label}`;
            cell.appendChild(leaf);
            host.appendChild(cell);
          }
        }
        document.body.appendChild(host);
      },
      { statuses: [...STATUS_TOKENS], grounds: STATUS_GROUNDS },
    );

    const fails = await contrastFailures(page, { root: "#status-token-matrix" });

    expect(
      fails,
      fails.map((f) => `  ${f.ratio}:1 (needs ${f.need}) — "${f.text}"`).join("\n"),
    ).toEqual([]);
  });
}
