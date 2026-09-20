import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression, pinned to a fixed dataset.
 *
 * Separate from playwright.config.ts for one reason: the two suites want
 * opposite things from the database.
 *
 *  - contrast.spec.ts wants REAL data locally. Every pairing it can measure is
 *    one more chance to catch a 1.4:1, and a populated leaderboard has text
 *    that an empty state does not.
 *  - visual.spec.ts wants FIXED data. It compares pixels, so any input that
 *    changes between two runs is a false failure. That is not hypothetical:
 *    four baselines went stale in thirty minutes with no code change, because
 *    the leaderboard gained rows and `fullPage` captured the height shift.
 *
 * So this config forces the placeholder Supabase credentials CI already uses.
 * The client constructs, the network call fails, the `?? []` fallbacks render
 * empty states, and the result is byte-identical on every machine with no
 * database anywhere in the loop.
 *
 * Three things that buys:
 *
 *  1. Determinism from the input, not from patching over it. The masking and
 *     height-pinning in the spec stay as a second layer, but the shot no
 *     longer depends on what 145 Gauchos did last night.
 *  2. The suite runs in CI at all. It never has — ci.yml runs Contrast only,
 *     and baselines shot against a live database could never have matched a
 *     CI run against placeholders.
 *  3. The empty states get tested. They were the one part of the UI nothing
 *     looked at, and they are what every student saw on day one.
 *
 * What it gives up: the populated layouts are no longer pixel-checked. They
 * were already masked and pinned, so little is lost, and contrast.spec.ts
 * still measures the real populated pages locally.
 *
 * Port 3102, not the 3101 in the sibling config, so the two suites can run
 * back to back without fighting over the port.
 */
const PLACEHOLDER_SUPABASE = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  // next/font reaches the network at build time; without this a machine
  // behind a proxy can swap the font and fail every shot for the wrong
  // reason. Harmless where it is already unset.
  NEXT_TELEMETRY_DISABLED: "1",
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: /visual\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: "disabled" } },
  use: {
    baseURL: "http://localhost:3102",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    // `env` here is added to the server's environment, but .env.local is read
    // by Next itself and would win, so the build and start are run with the
    // placeholders exported explicitly.
    command: "npm run build && npx next start --port 3102",
    url: "http://localhost:3102",
    reuseExistingServer: false,
    timeout: 300_000,
    env: PLACEHOLDER_SUPABASE,
  },
});
