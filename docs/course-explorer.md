# Public course explorer

Implemented October 9, 2026. A public course utility alongside the existing Lagoon marketing site, designed to help students choose classes and then manage their registered schedule in the app. It uses the existing brand without showing the upcoming app redesign.

## Routes and scope

| Route | Behavior |
|---|---|
| `/courses` | Course-code search, department selection, 24 results per page, historical grade summaries |
| `/courses/[slug]` | Grade chart, weighted GPA, A-range/D/F percentages, instructor/quarter filters, quarterly history, related courses |
| `/courses/sitemap.xml` | Canonical URLs for available courses |

Entry points are in the main/mobile navigation, footer, homepage grade tile, and grade-distribution guide. Default ordering is historical enrollments, not “easiest classes.” Exact code matches rank first. Search ignores case, spaces, and punctuation, so `math3a` matches `MATH 3A`. It searches course codes, not course titles or professor names.

Forms use GET and work without JavaScript. Search and filter URLs are bookmarkable. Pagination retains the query and department. Unknown courses return 404; incompatible filters show an explicit no-records state. Courses without letter grades show a dash and an explanation, rather than zero GPA.

This release does not include current offerings, open seats, prerequisites, professor reviews, GE eligibility, grade predictions, app shortlist synchronization, or a web schedule planner. The CTA accurately describes importing a GOLD schedule after registration. No course selection here automatically imports into the app.

## Source and verification

Original source: [Daily Nexus grades-data](https://github.com/dailynexusdata/grades-data), whose README explicitly permits reuse. Daily Nexus obtained grade counts from UCSB’s Registrar through public-records requests. Its published coverage is Fall 2009–Summer 2026, for course instances with at least five enrolled students. Original counts are before optional grading conversions.

[UCSBPlat’s creator](https://iamjiamingliu.com/blogs/ucsbplat.md) describes using this same grade source. UCSBPlat inspired the public utility, but this implementation does not scrape UCSBPlat, copy its reviews, or depend on its API.

The existing app database was audited before implementation. It had 10,498 course summaries and 206,422 raw records. For MATH 3A, 196 imported records represented 98 distinct content records, each imported twice, with separate March 14/March 18 creation timestamps. Its history ended in Fall 2025. The original source had 101 MATH 3A records through Summer 2026. These observations justified using the original source directly for this website; **the app database was not modified**. App ingestion and duplicate cleanup remain separate maintenance work.

The committed snapshot `web/data/course-grades.json.gz` contains:

- 10,653 courses;
- 106,173 non-empty grade records from 106,226 original CSV rows;
- 53 zero-enrollment/zero-grade rows omitted;
- original source URL, retrieval time, source SHA-256, schema version, and record counts;
- compact course/grade tuples, compressed to approximately 1.2 MB (about 7.6 MB unpacked JSON).

The retrieval timestamp is shown on each page, and available coverage is computed from records. These counts describe the initial artifact, not constants baked into the UI. The dataset remains server-only and is not sent wholesale to the browser.

The snapshot preserves each original non-empty source record. It does not deduplicate equal-looking source rows, which could represent separate reported instances. This avoids reproducing duplicate database imports while respecting source multiplicity. Multiword department codes are preserved instead of splitting at the first space. Historical alphanumeric course numbers are supported.

## Refresh and maintenance

From the repository root:

```sh
python3 web/scripts/refresh-course-data.py
```

The refresh script uses Python’s standard library and the public CSV. It requires no credentials and performs no database writes. It validates required columns, course parsing, quarter/year values, nonnegative integer counts, and a minimum dataset size. It writes a temporary artifact and replaces the existing snapshot only after the complete import succeeds. Review the printed counts and source hash, then rerun checks, commit the new artifact, and deploy.

`web/lib/courses.ts` reads and decompresses the versioned artifact once per server process. The derived directory is memoized; React request caching shares metadata/page lookups. There are no runtime upstream requests, anonymous Supabase queries, 1,000-row caps, per-visitor authentication dependencies, or credential requirements for this tool. Existing site middleware/session behavior remains in place.

`next.config.ts` explicitly traces the artifact into course-route deployment bundles. The private `COURSE_GRADES_DATA_FILE` environment variable can select another server-side snapshot path for isolated tests; ordinary deployments should leave it unset and use the committed artifact. Updating the artifact requires a new build/deployment, not a database refresh. Sitemap HTTP caching is one hour, with stale-while-revalidate.

If the snapshot is missing or invalid, pages show an unavailable state and are noindexed; the course sitemap returns 503 with Retry-After. Missing codes return 404. These are distinct from a successful search with no matches. Source/schema changes must update the refresh script, unpacker, grade tests, and this document together.

Before adding GE filtering, obtain current official UCSB requirements: the Daily Nexus GE CSV describes **2023–24**, so it is not used to claim current GE eligibility. Seat availability needs reliable live access and visible freshness. Professor name matching/reviews require separate verified data access.

## Grade calculations

Pure logic: `web/lib/course-grades.ts`. Directory and detail pages use the same source and formulas.

- Letter denominator: A+, A, A−, B+, B, B−, C+, C, C−, D+, D, D−, F.
- GPA: summed grade points / summed letter grades. Weights: 4.0, 4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0.0 respectively. This weights individual grades, not section averages.
- A range: `(A+ + A + A−) / letter grades`.
- D/F: `(D+ + D + D− + F) / letter grades`.
- Chart bins group plus/minus grades under A, B, C, or D, with F separate.
- P, NP, S, and U are excluded from letter metrics. The source’s P, S, and unsatisfactory (`su`) counts are preserved. NP has no separate source column and is retained as unknown, not inferred.
- No letter grades means null GPA/rates, displayed as a dash with an explanation.
- Quarter sorting is year, then Winter/Spring/Summer/Fall; alphabetical sorting is wrong.
- Enrollment totals include repeated enrollments and are not unique students. Published records are not claimed as uniquely identified sections.

GPA is shown to two decimals and percentages to one. Grade-count/sample-size metrics are visible. Source information explains grading conversions and exclusions. Historical outcomes do not establish difficulty, workload, teaching quality, or a student’s future grade.

## Design and accessibility

The explorer uses existing cream/navy/gold tokens, Inter typography, monospaced small labels, hairlines, generous spacing, and restrained rounded panels. All colors resolve from the shared brand system. Gold marks the primary action and A-grade bar; text uses readable ink colors. It has no app screenshots, gradients, shadows, or speculative redesign imagery.

Course cards adapt from three columns to two, then one. Metrics appear before filters so students get an immediate answer. Mobile filters wrap and metrics become a two-column strip. Quarter history uses a keyboard-accessible native disclosure, keeping the download CTA reachable without scrolling through decades of rows. The expanded table scrolls inside its container. Both themes, reduced motion, visible keyboard focus, labeled controls, semantic tables, chart descriptions, and no-JavaScript form behavior are supported.

## SEO and sharing

- Canonical origin: `https://www.lagoonucsb.com`.
- Populated unfiltered course pages and the directory are indexable. Query variants use `noindex,follow` and canonicalize to the unfiltered page. Unsupported/missing data is not promoted for indexing.
- Course-specific titles, descriptions, Open Graph, and Twitter metadata describe the actual code and historical grades. Social cards use the existing brand image.
- JSON-LD describes a WebPage, breadcrumbs, and source citation. It does not invent educational Course properties, schedules, star ratings, or AggregateRating.
- The main sitemap lists `/courses`; robots also advertises the separate course sitemap. Available course URLs are included without invented last-modified dates.
- Course pages are server-rendered and linked from search results, related courses, and the sitemap.

This is a useful-content strategy, not a guarantee of rankings, traffic, or conversion. Monitor search impressions, indexed URLs, filter exclusions, repeat use, and download clicks before expanding the tool.

## Analytics and conversion

`web/components/courses/course-events.tsx` explicitly addresses marketing GA4 stream `G-2F8CTN4DNP`.

| Event | Fields | Meaning |
|---|---|---|
| `course_search` | query length, department, result count | A filtered directory visit |
| `course_view` | course ID | A course/filter page visit |
| `course_filter` | course ID, instructor/quarter filter booleans | Filtered course exploration |
| Existing `app_store_click` / `conversion` | CTA source `courses` | Contextual download-link click |

Custom search events send length rather than raw query text. Existing page views still include the URL/query, as elsewhere on the site. Course events are visits, not unique-user counts. Existing page-view and scroll events remain. The route stays in the marketing group; cross-group links use `GroupLink` to keep analytics streams separate.

The existing App Store provider/campaign-token mechanism still controls acquisition attribution. Download-link clicks are not confirmed installations or completed schedule imports. Measuring those later steps needs app-side attribution; this release does not claim to measure them.

## Tests and review

Run from `web/`:

```sh
npm run check
npm run test:courses
npm run test:e2e
node scripts/seo-snapshot.mjs check http://localhost:3103
```

`test:courses` uses an isolated generated snapshot with 1,005 courses and a 1,003-record course. It tests complete dataset reads, compact search codes, filters, weighted math, non-letter nulls, invalid combinations, no matches, 404s, sitemap completeness, canonical/noindex metadata, mobile themes/overflow, and analytics routing. Production code contains no demo-data switch or fixture branch. The generator writes only an ignored test artifact; the committed real dataset remains intact.

The full browser suite adds course-directory/detail rendered contrast in both themes and retains navigation and guide SEO checks. CI requires the populated course suite. Course data renders even when CI’s unrelated Supabase credentials are placeholders. Existing marketing SEO snapshots cover the grade-guide update; course metadata is covered directly by integration tests.

Final validation: production builds, TypeScript, brand guard, and ESLint passed; all 7 populated course tests, 34 browser/contrast/SEO tests, 11 visual tests, and 32 existing marketing SEO baselines passed. Shared navigation/footer screenshots were refreshed, and an older visual fixture assertion was corrected to match the current leaderboard empty state. Desktop and mobile pages were reviewed visually. Deployment file traces include the real snapshot for the directory, detail route, and course sitemap. MATH 3A was cross-checked against the original source: 101 records and 12,385 letter grades.

Repository changes do not themselves imply production deployment. The app database duplicate-import issue is documented for follow-up and was not changed in this website release.
