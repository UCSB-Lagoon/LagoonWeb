# Search & AI-answer visibility plan — lagoonucsb.com

*Written 2026-11-26. This is SEO and content work, not a redesign: the current
visual design stays.*

**Goal:** when a UCSB student asks ChatGPT, Claude, Perplexity, Google AI
Overviews or Google about schedules and GOLD, dining hall hours and menus,
finals, registration deadlines, grade distributions, campus apps or Isla Vista,
the answer should cite a lagoonucsb.com page, and that page should state the
answer in its first lines.

**Ground rule:** every fact on the site comes from the repo's existing copy or
from real data: the grade snapshot in `web/data/`, or the app repo's
hand-checked `RegistrarDeadlines` / `CampusHolidays` tables and the UCSB quarter
API dates in `marketing/CALENDAR.md`. No invented stats, reviews or counts.

---

## 1. Audit (what exists today)

| Area | State | Verdict |
|---|---|---|
| **Server rendering** | Homepage, guides, /courses and course pages all render their full text on the server: `curl` returns all the copy, FAQ included. Course pages are dynamic but read a local snapshot, with no upstream call. | ✅ Crawlers and AI fetchers can read everything. |
| **robots.txt** | `*` allows everything except `/api/ /auth/ /admin /me /login /lab`. **GPTBot, Google-Extended and CCBot are blocked site-wide** (added May 2026, "content is not for model training"), along with Bytespider and omgili. OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot and Bingbot fall through to `*`, so they're allowed. | ⚠️ Search bots are fine. The training block keeps Lagoon out of what ChatGPT and Gemini *know* without a live search, and Google-Extended also controls grounding in Gemini apps. |
| **llms.txt** | `public/llms.txt` exists, but it's stale and partly wrong: it lists XP/streaks (gamification UI is off), a "native Daily Nexus reading view" (articles open in Safari Reader), an unsourced "~37,000 enrolled", Fall 2026 dates that have passed, apex URLs that 307-redirect, and a "not licensed for AI training" line. It's hand-maintained, so the guide list drifts. | ❌ Rewrite from repo facts; generate the guide list. |
| **Sitemap** | `/sitemap.xml` lists 40 URLs (homepage, live pages, 29 guides with real `lastModified` from frontmatter). `/courses/sitemap.xml` lists all 10,653 course pages. Both are referenced from robots. Noindex pages (`/go`, `/schedule`, `/friends`, `/wrapped`) are correctly left out. | ✅ No real gaps. `/cup` is indexable but missing; it's thin today ("No chapter is on the board yet"), so leave it out until it has rows. |
| **Canonicals** | Every page sets an absolute `www` canonical. The apex `lagoonucsb.com` redirects to `www` with a **307 (temporary)**. | ⚠️ The redirect should be a 308/301 (Vercel domain setting, owner's account). |
| **Titles / descriptions** | Unique and specific on every guide. Course pages use the same description template on all 10,653 pages, with no numbers. | ⚠️ Course descriptions waste the snippet: put the real GPA / A-range figures in. |
| **JSON-LD: homepage** | WebSite, MobileApplication, Organization, FAQPage. All parse. Problems: (a) the FAQPage has 6 questions but the page shows 7 ("Is Lagoon affiliated with UCSB?" is missing); (b) `featureList` advertises class vibes and XP/streaks, both flagged off in the app; (c) no `@id`s, so the publisher isn't linked to the Organization; (d) App Store URLs use the old `/ucsb-lagoon/` slug, while the canonical is now `/lagoon-ucsb-campus/id6760681142` ("Lagoon: UCSB Campus App"). | ⚠️ Fix all four. Don't add `aggregateRating`: there's no rating data in the repo. |
| **JSON-LD: guides** | BreadcrumbList + one Article (consolidated from frontmatter) on all 29; FAQPage on the 5 guides that show a visible FAQ. | ✅ Correct. Add `abstract` once guides carry a summary. No HowTo: Google retired HowTo rich results in 2023, and the guides aren't step-by-step procedures. |
| **JSON-LD: courses** | Course pages: `WebPage` + breadcrumb + `citation`. `/courses`: none. | ⚠️ Describe the data as a `Dataset` (creator, source, temporal coverage), which Google Dataset Search and AI tools read. |
| **Answer-first content** | Guide intros are mood-setting ("Finals week gets harder when…"), not answers. No guide states a date in its first lines except the Fall 2026 start-date page, and that date has passed. Course pages open with "A clearer picture of the classes ahead." | ❌ Biggest content gap: AI tools quote the first factual sentence they find. |
| **Internal linking** | Header links Courses and Guides; every guide has related links and an ArticleLinks row; the homepage links 3 guides plus the guides hub; course pages link department siblings and the grade guide. | ✅ Fine. |
| **Page speed basics** | 103 kB shared first-load JS; fonts self-hosted through `next/font`; guides static; Lighthouse SEO + a11y are hard CI gates (`seo.yml`). | ✅ No action. |
| **Guards** | `scripts/seo-snapshot.mjs` diffs every marketing page's title/meta/canonical/JSON-LD against goldens; `e2e/seo-audit.spec.ts` checks sitemap ↔ canonical ↔ Article dates. | ✅ Intentional changes must update goldens in the same PR. |

---

## 2. Plan, in priority order

### P0: do now (this PR)

1. **Rewrite `llms.txt` from repo facts, generated at build time.**
   *Why:* it's the one file AI agents read to describe Lagoon, and today it tells them things that aren't true (XP, a native Nexus reader, a made-up enrolment figure). Generating the guide list from `getGuideIndex()` and the course count from the grade snapshot keeps it from drifting again.
   Also add **`/llms-full.txt`**: every guide's text in one plain-text file, so an agent can answer from the whole guide library in one fetch.

2. **Answer-first summaries on the high-intent guides** (`summary` frontmatter → an "In short" box at the top of the article, plus Article `abstract`).
   *Why:* AI Overviews and answer engines lift the first direct, dated sentence. Topics: GOLD, dining hours, dining menus, finals, registration, pass times, grade distributions, campus apps, Isla Vista, the start-date page, and who's in my class.
   *Sources:* Fall 2026 and Winter 2027 instruction and finals dates come from the UCSB quarter API (`marketing/CALENDAR.md`). Deadlines come from `RegistrarDeadlines` (L&S, checked 2026-10-04; BARC and Financial Aid checked 2026-10-09). **Not published:** Winter Pass 2 and Pass 3 opening days, because the registrar table and the UCSB API disagree by a day (open follow-up in `calendar.json`).

3. **Answer-first line + real numbers on course pages.**
   *Why:* "CMPSC 16 UCSB grade distribution" is a question with a numeric answer. The page should say "3.22 average GPA, 53.3% A-range, Fall 2009 – Spring 2026" in its first paragraph and in its meta description, not a tagline. The numbers are computed from the unfiltered history, so the canonical page never changes with query filters.
   Add a `Dataset` description (source, creator, coverage) to course pages and `/courses`.

4. **Complete the homepage structured data.** Add the missing 7th FAQ to FAQPage; add `@id`s and link publisher → Organization; replace flagged-off features in `featureList` with shipped ones (Today view, real dining hours, Canvas homework and deadlines, friends' free time, Pass Time, lock-screen class countdown, Quarter Wrapped); point App Store URLs at the canonical slug.
   Add two visible FAQ entries that match high-intent queries: dining hours and menus, and homework and deadlines. Both answers come from shipped features.
   *Why:* structured data that disagrees with the visible page, or with the app, is ignored or treated as a negative signal.

5. **robots.txt: let GPTBot, Google-Extended and CCBot in** (still blocking Bytespider and omgili, still disallowing the private paths for everyone). **Separate commit, and a policy reversal:**
   - *For:* the content is marketing for a free app. Being in the training data is how ChatGPT and Gemini "know" Lagoon without a live search, and Google-Extended also gates grounding in Gemini apps.
   - *Unaffected:* Google Search and AI Overviews. Google documents that Google-Extended doesn't affect Search inclusion or ranking; AI Overviews use Googlebot.
   - *Against:* the May 2026 block was deliberate.
   - **Needs the owner's yes before merge.** Revert that one commit to keep the block.

### P1: next, needs the owner or more data

6. **Apex → www redirect: 307 → 308.** Vercel → Project → Domains → set `lagoonucsb.com` to "Redirect to www.lagoonucsb.com" with the permanent (308) option. *Why:* a temporary redirect tells crawlers to keep the apex URL; external links to `lagoonucsb.com` don't fully consolidate. (Owner's Vercel account.)
7. **Google Search Console + Bing Webmaster Tools.** Verify the `www` property, submit both sitemaps, and watch Coverage and the "Discovered – not indexed" count on the 10,653 course pages. Bing matters more than it looks: ChatGPT search and Copilot draw on Bing's index. (Owner's Google and Microsoft accounts.)
8. **IndexNow** for course and guide updates: a key file in `public/` plus a ping on deploy. Only worth it once Bing is verified. (Owner's Bing account; the key is public by design.)
9. **Homepage "500+ courses" wording.** The FAQ says grade data covers "over 500 courses"; the web snapshot has 10,653 courses (Daily Nexus dataset, retrieved 2026-10-10). The app reads a different table (`grade_distributions`, ~10,498 distinct courses), so the owner should pick the figure that's true for both before changing the line. Left unchanged here.
10. **A dated "UCSB academic calendar 2026–27" page** built from `RegistrarDeadlines` + `CampusHolidays` + the quarter API, regenerated when those tables change. It would answer "when is UCSB finals week / when are fees due" directly. Wait until Spring 2027 dates post, so the page isn't mostly "not published yet".
11. **`/cup` in the sitemap** once at least one chapter is on a board.

### Not doing (and why)

- **No redesign.** The owner prefers the current site.
- **No HowTo schema.** Google dropped the rich result; the markup adds nothing.
- **No `aggregateRating` / review markup.** There's no rating data in the repo, and inventing one breaks Google's policy and ours.
- **No hidden "SEO text".** Everything added is visible on the page.
- **No new course-adjacent pages** (professor pages, department pages). The data exists, but each would be a new thin-page surface of thousands of URLs; revisit after Search Console shows how the 10,653 course pages index.
