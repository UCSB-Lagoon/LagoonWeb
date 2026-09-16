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
      await page.addStyleTag({
        content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
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
