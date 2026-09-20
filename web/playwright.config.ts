import { defineConfig, devices } from "@playwright/test";

/**
 * Contrast regression, against real local data.
 *
 * Visual regression moved to playwright.visual.config.ts, which pins a fixed
 * dataset. The two suites want opposite things from the database — contrast
 * wants the most populated page it can get, visual wants an input that never
 * changes — and that is why they are two configs rather than two projects.
 *
 * This exists because of a specific pattern: four passes of the 2026-09
 * repaint each shipped something that *looked* right and wasn't, and every
 * contrast bug was caught by measuring a rendered page — never by reading
 * source. `scripts/check-brand.mjs` catches a raw colour; it cannot catch a
 * 1.4:1 pairing of two perfectly legal tokens. That's this.
 */
export default defineConfig({
  testDir: "./e2e",
  // visual.spec.ts belongs to playwright.visual.config.ts, which pins the
  // placeholder Supabase credentials it needs to be deterministic. This
  // config deliberately inherits the ambient env — real data locally — so
  // picking that spec up here (which a bare `playwright test`, i.e.
  // `npm run test:e2e`, otherwise would) runs it against a live database and
  // trips its own fixture guard.
  testIgnore: /visual\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  // A 0.2% pixel budget absorbs font antialiasing across machines without
  // hiding a real layout shift.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3101",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  // Port 3101, not 3000, and never reused.
  //
  // This suite measures colours that only exist in a production build:
  // `next dev` serves the Tailwind layer as a stub chunk, so @theme is absent
  // and every token falls back. Pointed at :3000 with `reuseExistingServer`,
  // it would silently adopt whatever dev server the developer already had
  // running and measure that instead — which is exactly what happened. The
  // suite reported green on a page where `--font-inter` was undefined and the
  // whole marketing site was rendering in Times; against a real build the same
  // commit had 56 failing pairings.
  //
  // A dedicated port it always starts itself means the thing under test is
  // always the thing that ships.
  webServer: {
    command: "npm run build && npx next start --port 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
