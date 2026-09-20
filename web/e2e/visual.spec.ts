import { test, expect } from "@playwright/test";

/**
 * Visual regression on the routes people actually land on.
 *
 * Catches the other half of the 2026-09 failure mode: a change that leaves
 * the build green and the contrast fine but silently detaches half the page
 * from the brand. Renaming the Tailwind scale did exactly that to 168 utility
 * classes, and nothing but looking at it would have caught it.
 *
 * Baselines are committed. Update deliberately with:
 *   npx playwright test --update-snapshots
 * and eyeball the diff in the PR — an updated baseline is a design decision,
 * not a chore.
 */

const ROUTES = ["/", "/hub", "/stats", "/leaderboard", "/captains"];

for (const route of ROUTES) {
  for (const theme of ["light", "dark"] as const) {
    test(`visual · ${route} · ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        try { localStorage.setItem("theme", t); } catch {}
      }, theme);
      await page.goto(route, { waitUntil: "networkidle" });
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);

      // Freeze anything that would make the shot differ run to run: the live
      // pulse animations, and the counts that come from a live database.
      //
      // The height pin is the important half. Masking alone paints over a
      // live region but does NOT fix its size, so a leaderboard that gained
      // two rows overnight grew the page and shifted every pixel below it —
      // four baselines went stale between two runs half an hour apart with no
      // code change at all. Pinning `[data-live]` to a fixed box makes the
      // shot independent of how many rows the database returns, and of
      // whether it returns any: the empty state is pinned to the same size.
      //
      // `[data-live]` was already the mask selector here and matched nothing —
      // the attribute had never been added to the markup, so the mask was a
      // no-op and this was only ever measuring unmasked live data. It is now
      // on the shared primitives that render database rows (StatCard's value,
      // BarRow, Donut, ActivityArea) and on each list that maps over query
      // results.
      //
      // What this gives up: the interior design of those lists is no longer
      // pixel-checked. That is covered instead by e2e/contrast.spec.ts, which
      // measures the real rendered colours of that same live text on every
      // route. Layout, chrome, cards, headers, footers and CTAs — the "half
      // the page silently detached from the brand" case this suite exists for
      // — stay fully under test.
      await page.addStyleTag({
        content: [
          `*,*::before,*::after{animation:none!important;transition:none!important}`,
          `[data-live]{height:var(--vr-pin)!important;min-height:var(--vr-pin)!important;`,
          `max-height:var(--vr-pin)!important;overflow:hidden!important}`,
          `ol[data-live],ul[data-live]{--vr-pin:22rem}`,
          `div[data-live]{--vr-pin:3rem}`,
          `.h-72[data-live]{--vr-pin:18rem}`,
          `.h-56[data-live]{--vr-pin:14rem}`,
        ].join(""),
      });
      await page.waitForTimeout(250);

      const name = `${route === "/" ? "home" : route.slice(1).replace(/\//g, "-")}-${theme}.png`;
      await expect(page).toHaveScreenshot(name, {
        fullPage: true,
        // Live numbers and relative timestamps change between runs; they are
        // content, not layout, and masking them keeps the check about design.
        mask: [page.locator("[data-live]"), page.locator("time")],
      });
    });
  }
}
