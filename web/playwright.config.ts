import { defineConfig, devices } from "@playwright/test";

/**
 * Visual + contrast regression.
 *
 * This exists because of a specific pattern: four passes of the 2026-09
 * repaint each shipped something that *looked* right and wasn't, and every
 * contrast bug was caught by measuring a rendered page — never by reading
 * source. `scripts/check-brand.mjs` catches a raw colour; it cannot catch a
 * 1.4:1 pairing of two perfectly legal tokens. That's this.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  // A 0.2% pixel budget absorbs font antialiasing across machines without
  // hiding a real layout shift.
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
