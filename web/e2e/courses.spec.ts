import { test, expect } from "@playwright/test";
import { aggregateGrades, courseSearch, courseSlug, quarterOrder, type GradeRecord } from "../lib/course-grades";

const base: GradeRecord = {
  quarter: "Fall 2025", instructor: "LEE J", total_students: 0,
  grade_a_plus: 0, grade_a: 0, grade_a_minus: 0, grade_b_plus: 0, grade_b: 0, grade_b_minus: 0,
  grade_c_plus: 0, grade_c: 0, grade_c_minus: 0, grade_d_plus: 0, grade_d: 0, grade_d_minus: 0, grade_f: 0,
  grade_p: 0, grade_np: 0, grade_s: 0, grade_u: 0,
};

test("grade math weights individual grades and excludes non-letter grades", () => {
  const result = aggregateGrades([
    { ...base, total_students: 100, grade_a: 100 },
    { ...base, total_students: 1, grade_f: 1 },
    { ...base, total_students: 50, grade_p: 50 },
  ]);
  expect(result.gpa).toBeCloseTo(400 / 101);
  expect(result.letterStudents).toBe(101);
  expect(result.aRate).toBeCloseTo(10000 / 101);
  expect(result.dfRate).toBeCloseTo(100 / 101);
  expect(result.nonLetter).toBe(50);
  const nonLetter = aggregateGrades([{ ...base, grade_p: 30, total_students: 30 }]);
  expect(nonLetter.gpa).toBeNull();
  expect(nonLetter.aRate).toBeNull();
  expect(nonLetter.dfRate).toBeNull();
  expect(aggregateGrades([{ ...base, grade_a_plus: 1, grade_a_minus: 1, grade_d_minus: 1 }]).gpa).toBeCloseTo(2.8);
  expect(courseSlug("CH ST", "1A")).toBe("ch-st-1a");
  expect(quarterOrder("Winter 2026")).toBeGreaterThan(quarterOrder(""));
  expect(quarterOrder("Fall 2025")).toBeLessThan(quarterOrder("Winter 2026"));
  expect(courseSearch([], "MATH3A", "")).toEqual([]);
});

test("search covers the complete snapshot beyond 1,000 courses and supports compact course codes", async ({ page }) => {
  await page.goto("/courses");
  await expect(page.getByText("1,005 courses with historical data")).toBeVisible();
  await page.getByLabel("Course code", { exact: true }).fill("math3a");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await expect(page.getByRole("heading", { name: "MATH 3A", exact: true })).toBeVisible();
  await expect(page.locator(".course-card")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.lagoonucsb.com/courses");
});

test("course detail includes every source record and filters actual records", async ({ page }) => {
  await page.goto("/courses/math-3a");
  await expect(page.getByRole("heading", { name: "MATH 3A", exact: true })).toBeVisible();
  await expect(page.getByText("1,003 published records", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".course-stat-strip").getByText("3.09", { exact: true })).toBeVisible();
  await expect(page.locator(".course-stat-strip").getByText("45.5%", { exact: true })).toBeVisible();
  await page.getByLabel("Instructor", { exact: true }).selectOption("GARCIA M");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".course-stat-strip").getByText("3.17", { exact: true })).toBeVisible();
  await expect(page.locator(".course-stat-strip").getByText("66.7%", { exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByLabel("Quarter", { exact: true }).selectOption("Fall 2025");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText("No records for this combination.")).toBeVisible();
  await page.getByRole("link", { name: "View all history" }).click();
  await expect(page.getByRole("img", { name: /Grade distribution/ })).toBeVisible();
  await page.getByText("Quarter by quarter", { exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("no-match, non-letter, and unknown-course states are truthful", async ({ page, request }) => {
  await page.goto("/courses?q=notacourse");
  await expect(page.getByText("No matching courses yet.")).toBeVisible();
  await page.goto("/courses/int-199");
  await expect(page.getByText("No letter grades in these records.")).toBeVisible();
  await expect(page.locator(".course-stat-strip").getByText("—", { exact: true })).toHaveCount(3);
  const missing = await request.get("/courses/not-a-real-course");
  expect(missing.status()).toBe(404);
  const sitemap = await request.get("/courses/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect((xml.match(/<loc>/g) ?? []).length).toBe(1005);
  expect(xml).toContain("https://www.lagoonucsb.com/courses/math-3a");
  expect(xml).not.toContain("<lastmod>");
});

for (const theme of ["light", "dark"]) {
  test(`mobile ${theme} has no page overflow and usable controls`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(value => localStorage.setItem("theme", value), theme);
    for (const path of ["/courses", "/courses/math-3a"]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await expect(page.getByRole("button", { name: path === "/courses" ? "Explore" : "Apply filters", exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Courses" })).toBeVisible();
  });
}

test("course engagement and app clicks use the marketing analytics stream", async ({ page }) => {
  await page.goto("/courses/math-3a");
  await page.waitForFunction(() => Boolean((window as Window & { gtag?: unknown }).gtag));
  await page.locator('[data-lagoon-cta="courses"]').evaluate(el => {
    el.addEventListener("click", event => event.preventDefault());
    (el as HTMLElement).click();
  });
  const events = await page.evaluate(() => ((window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? []).map(entry => Array.from(entry)));
  expect(events.some(entry => entry[1] === "course_view" && (entry[2] as Record<string, unknown>).send_to === "G-2F8CTN4DNP")).toBeTruthy();
  expect(events.findIndex(entry => entry[0] === "config")).toBeLessThan(events.findIndex(entry => entry[1] === "course_view"));
  expect(events.some(entry => entry[1] === "app_store_click" && (entry[2] as Record<string, unknown>).cta_source === "courses")).toBeTruthy();
});
