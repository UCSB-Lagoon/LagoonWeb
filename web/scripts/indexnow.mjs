#!/usr/bin/env node
/**
 * IndexNow: tell Bing (and Yandex, Seznam, Naver…) which URLs changed, so they
 * recrawl now instead of whenever. Bing's index feeds Copilot and is one of
 * ChatGPT search's sources, so this is the fast lane for AI answers too.
 *
 *   node scripts/indexnow.mjs                 # every URL in /sitemap.xml (homepage, guides, live pages)
 *   node scripts/indexnow.mjs --courses       # …plus all /courses/* pages (after a grade-snapshot refresh)
 *   node scripts/indexnow.mjs /ucsb-finals-week-guide /courses/cmpsc-16   # just these paths
 *   node scripts/indexnow.mjs --dry-run       # print what would be sent
 *
 * Run it AFTER a production deploy: the engines fetch the key file from the
 * live site to check the request, so it must already be served at
 * https://www.lagoonucsb.com/<KEY>.txt (web/public/<KEY>.txt).
 * The key is public by design; it only proves the sender controls the site.
 */
const HOST = "www.lagoonucsb.com";
const ORIGIN = `https://${HOST}`;
const KEY = "de42f896c454d099f73a5950eea337ea";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH = 10_000; // protocol maximum per request

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const withCourses = args.includes("--courses");
const paths = args.filter(a => a.startsWith("/"));

async function locs(sitemapPath) {
  const res = await fetch(`${ORIGIN}${sitemapPath}`);
  if (!res.ok) throw new Error(`${sitemapPath}: HTTP ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

async function main() {
  const keyRes = await fetch(`${ORIGIN}/${KEY}.txt`);
  const live = keyRes.ok && (await keyRes.text()).trim() === KEY;
  if (!live && !dryRun) {
    console.error(`Key file isn't live at ${ORIGIN}/${KEY}.txt yet. Deploy first.`);
    process.exit(1);
  }

  let urls = paths.length ? paths.map(p => `${ORIGIN}${p}`) : await locs("/sitemap.xml");
  if (withCourses) urls = urls.concat(await locs("/courses/sitemap.xml"));
  urls = [...new Set(urls)].filter(u => new URL(u).host === HOST);

  console.log(`${urls.length} URL(s)${dryRun ? " (dry run)" : ""}`);
  if (dryRun) { urls.slice(0, 20).forEach(u => console.log(`  ${u}`)); return; }

  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList }),
    });
    // 200 = accepted, 202 = accepted while the key is being checked.
    console.log(`batch ${i / BATCH + 1}: HTTP ${res.status} ${res.statusText}`);
    if (res.status >= 400) { console.error(await res.text()); process.exit(1); }
  }
}

main().catch(error => { console.error(error); process.exit(1); });
