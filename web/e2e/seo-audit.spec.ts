import { test, expect } from "@playwright/test";
import * as cheerio from "cheerio";
import { campaignToken } from "../components/app-store-campaign";

const ORIGIN = "https://www.lagoonucsb.com";

test("campaign tokens retain QR sources and distinguish external referrers", () => {
  expect(campaignToken("?src=desktop-qr", "")).toBe("go-desktop-qr");
  expect(campaignToken("?src=flyer&utm_source=instagram&utm_campaign=fall", "")).toBe("instagram-fall");
  expect(campaignToken("", "https://www.lagoonucsb.com/guides")).toBe("web");
  expect(campaignToken("", "https://notlagoonucsb.com/")).toBe("notlagoonucsb.com");
  expect(campaignToken(`?src=${"a".repeat(80)}`, "")).toHaveLength(40);
});

test("sitemap pages use the preferred host and guides have one consistent Article", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const xml = cheerio.load(await sitemap.text(), { xmlMode: true });
  const entries = xml("url").toArray();
  expect(entries.length).toBeGreaterThan(30);
  for (const entry of entries) {
    const url = xml(entry).find("loc").text();
    expect(new URL(url).origin).toBe(ORIGIN);
    const response = await request.get(new URL(url).pathname);
    expect(response.status(), url).toBe(200);
    const $ = cheerio.load(await response.text());
    const canonical = $("link[rel=canonical]").attr("href");
    expect(canonical, url).toBeTruthy();
    expect(new URL(canonical!).origin, url).toBe(ORIGIN);
    const schemas = $("script[type='application/ld+json']").toArray().map(el => JSON.parse($(el).text()));
    const articles = schemas.filter(s => s["@type"] === "Article");
    if (articles.length) {
      expect(articles, url).toHaveLength(1);
      expect(articles[0].dateModified, url).toBe($("time[datetime]").attr("datetime"));
      expect(xml(entry).find("lastmod").text().slice(0, 10), url).toBe(articles[0].dateModified);
    }
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).not.toContain("User-Agent: Googlebot");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
});

test("App Store review links do not emit download conversions", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean((window as Window & { gtag?: unknown }).gtag));
  await page.locator("[data-lagoon-review]").evaluate(el => {
    el.addEventListener("click", event => event.preventDefault());
    (el as HTMLElement).click();
  });
  const events = await page.evaluate(() => {
    const win = window as Window & { dataLayer?: Array<ArrayLike<unknown>> };
    return (win.dataLayer ?? []).map(e => Array.from(e));
  });
  expect(events.filter(e => e[0] === "event" && ["conversion", "app_store_click"].includes(String(e[1])))).toHaveLength(0);
});
