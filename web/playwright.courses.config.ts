import { defineConfig, devices } from "@playwright/test";

/** Offline populated tests with an ordinary snapshot at an isolated path. */
export default defineConfig({
  testDir: "./e2e", testMatch: /courses\.spec\.ts/, fullyParallel: true, workers: 2, reporter: "list",
  use: { baseURL: "http://localhost:3113", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/create-course-fixture.mjs && npm run build && npx next start --port 3113",
    url: "http://localhost:3113", reuseExistingServer: false, timeout: 300_000,
    env: {
      COURSE_GRADES_DATA_FILE: "e2e/fixtures/course-grades.json.gz",
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key", NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
