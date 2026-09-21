import { test, expect } from "@playwright/test";

for (const width of [320, 390, 1440]) {
  test(`public pages fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/hub",
      "/stats",
      "/guides",
      "/company",
      "/captains",
      "/leaderboard",
      "/challenges",
      "/ucsb-dining-menu",
      "/schedule",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await expect(page.locator("#lagoon-sticky-cta")).toHaveCount(0);
    }
  });
}

test("mobile menu closes with Escape and releases scroll lock on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto("/hub");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open menu", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#lagoon-menu")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});

test("download clicks fire once on the correct stream after soft navigation", async ({
  page,
}) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/");
  for (const [path, stream] of [
    ["/", "G-2F8CTN4DNP"],
    ["/hub", "G-5HY7LBXP8G"],
    ["/company", "G-2F8CTN4DNP"],
  ]) {
    if (path !== "/") {
      await page.locator(`.lagoon-nav-links a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
    await page.waitForFunction(({ path, stream }) => {
      const events = (window as Window & { dataLayer?: Array<ArrayLike<unknown>> }).dataLayer ?? [];
      return events.some(entry => {
        const event = Array.from(entry);
        const data = event[2] as { send_to?: string; page_path?: string } | undefined;
        return event[1] === "page_view" && data?.send_to === stream && data?.page_path === path;
      });
    }, { path, stream });
    // Dispatch a real bubbling click but prevent leaving the local site.
    const events = await page.evaluate(() => {
      const win = window as Window & { dataLayer?: unknown[] };
      win.dataLayer = [];
      const link = document.querySelector<HTMLAnchorElement>(
        ".lagoon-nav-actions a",
      )!;
      link.addEventListener("click", (e) => e.preventDefault(), { once: true });
      link.click();
      return (win.dataLayer as Array<ArrayLike<unknown>>)
        .map((e) => Array.from(e))
        .filter((e) => e[1] === "app_store_click");
    });
    expect(events).toHaveLength(1);
    expect(events[0][2]).toMatchObject({
      send_to: stream,
      page_path: path,
      cta_source: "nav",
    });
  }
});
