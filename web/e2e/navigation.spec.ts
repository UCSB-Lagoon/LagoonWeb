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
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
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

type DataLayerWindow = Window & {
  dataLayer?: Array<ArrayLike<unknown>>;
  __sameDocument?: true;
};
type EventFields = { send_to?: string; page_path?: string; cta_source?: string };

/** What this document has told GA4 so far. */
function inventory(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const win = window as DataLayerWindow;
    const calls = (win.dataLayer ?? []).map((entry) => Array.from(entry));
    return {
      configs: calls
        .filter((e) => e[0] === "config")
        .map((e) => e[1] as string),
      jsCalls: calls.filter((e) => e[0] === "js").length,
      pageViews: calls
        .filter((e) => e[1] === "page_view")
        .map((e) => e[2] as EventFields),
      tags: document.querySelectorAll('script[src*="googletagmanager"]').length,
      sameDocument: win.__sameDocument === true,
    };
  });
}

const mark = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    (window as DataLayerWindow).__sameDocument = true;
  });

/**
 * The invariant: marketing (G-2F8CTN4DNP) and the app (G-5HY7LBXP8G) are
 * separate GA4 streams, and no single document may configure both. GA4
 * cannot un-configure a stream, so once two are live its enhanced
 * measurement — emitted per stream with no send_to — cross-reports.
 *
 * gtag.js is aborted so the stub in site-analytics.tsx is the only writer
 * to dataLayer; the <Script> tags still render, so counting them is a real
 * check that only one stream's library was requested.
 */
test("a document configures exactly one GA4 stream, once", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());

  await page.goto("/");
  await page.waitForFunction(
    () => ((window as DataLayerWindow).dataLayer ?? []).length > 0,
  );

  let state = await inventory(page);
  expect(state.configs, "marketing document").toEqual(["G-2F8CTN4DNP"]);
  expect(state.tags, "one gtag.js tag").toBe(1);
  expect(state.pageViews).toEqual([
    expect.objectContaining({ send_to: "G-2F8CTN4DNP", page_path: "/" }),
  ]);

  // Inside the group: a soft navigation, one more page_view, no re-config.
  await mark(page);
  await page.locator('.lagoon-nav-links a[href="/company"]').click();
  await expect(page).toHaveURL(/\/company$/);
  await page.waitForFunction(
    () =>
      ((window as DataLayerWindow).dataLayer ?? []).some((entry) => {
        const e = Array.from(entry);
        return (
          e[1] === "page_view" &&
          (e[2] as EventFields)?.page_path === "/company"
        );
      }),
  );

  state = await inventory(page);
  expect(state.sameDocument, "stayed in the same document").toBe(true);
  expect(state.configs, "config is not repeated per route").toEqual([
    "G-2F8CTN4DNP",
  ]);
  expect(state.jsCalls, "gtag('js') is not repeated per route").toBe(1);
  expect(state.pageViews.map((p) => p.page_path)).toEqual(["/", "/company"]);

  // Across the group boundary: a full load, so the marketing stream goes
  // away with its document instead of joining the app's.
  await mark(page);
  await page.locator('.lagoon-nav-links a[href="/hub"]').click();
  await expect(page).toHaveURL(/\/hub$/);
  await page.waitForFunction(
    () => ((window as DataLayerWindow).dataLayer ?? []).length > 0,
  );

  state = await inventory(page);
  expect(state.sameDocument, "crossing the group reloads the document").toBe(
    false,
  );
  expect(state.configs, "app document").toEqual(["G-5HY7LBXP8G"]);
  expect(state.tags, "one gtag.js tag").toBe(1);
  expect(state.pageViews).toEqual([
    expect.objectContaining({ send_to: "G-5HY7LBXP8G", page_path: "/hub" }),
  ]);
});

test("download clicks fire once on the stream of the page they happen on", async ({
  page,
}) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());

  for (const [path, stream] of [
    ["/", "G-2F8CTN4DNP"],
    ["/hub", "G-5HY7LBXP8G"],
    ["/company", "G-2F8CTN4DNP"],
  ]) {
    await page.goto(path);
    await page.waitForFunction(
      () => ((window as DataLayerWindow).dataLayer ?? []).length > 0,
    );

    // Dispatch a real bubbling click but prevent leaving the local site.
    const events = await page.evaluate(() => {
      const win = window as DataLayerWindow;
      win.dataLayer = [];
      const link = document.querySelector<HTMLAnchorElement>(
        ".lagoon-nav-actions a",
      )!;
      link.addEventListener("click", (e) => e.preventDefault(), { once: true });
      link.click();
      return (win.dataLayer ?? [])
        .map((e) => Array.from(e))
        .filter((e) => e[1] === "app_store_click");
    });

    expect(events, path).toHaveLength(1);
    expect(events[0][2]).toMatchObject({
      send_to: stream,
      page_path: path,
      cta_source: "nav",
    });
  }
});
