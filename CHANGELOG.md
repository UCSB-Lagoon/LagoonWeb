# Lagoon Web — Changelog

## [2026-09-16] — Finish the repaint, and make the guard that was supposed to catch it actually run

The previous entry closed with a "Known broken" list and a contrast suite
reporting **8 passed / 6 failed**. That figure was wrong, and the reason it
was wrong is the most important thing in this entry.

### The suite was measuring a dev server

`playwright.config.ts` pointed at `:3000` with `reuseExistingServer`, so run
by hand it silently adopted whatever `next dev` was already running. Turbopack
serves the Tailwind layer as a ~2KB stub in dev: `@theme` is absent, so every
token falls back, `--font-inter` is undefined, and the entire marketing site
renders in **Times** with no brand colours at all. That is the page the suite
was grading. Nothing ran it in CI either.

Pointed at a production build, the same commit had **56** failing pairings,
not 6 — including five where text was painted the exact colour of its own
background. The config now uses a dedicated port it always builds and starts
itself, and `ci.yml` runs it.

Two further blind spots, both of which had been hiding real faults:

- **Scroll-reveal.** The marketing pages enter at `opacity: 0` until an
  observer adds `.on`. `visible()` correctly refuses to measure a transparent
  element, so everything below the fold on the homepage was never measured —
  on the page with the most content. Revealed, it had 27 more faults.
- **The reveal has a transition**, so a fast run sampled mid-fade and skipped
  elements a slow run caught. Two consecutive runs disagreed about a 4.34:1
  label. Animations are frozen before measuring now, so the set is the same
  every run.

Also excluded, deliberately: `aria-hidden` subtrees (not exposed to assistive
tech) and emoji-only leaves (an emoji paints from its own colour font, so
comparing `color` to the background reported a 🗓️ at 1.01:1).

### One systematic error behind most of the 56

Muted ink was picked against the **page ground** and then used on **cards**.
`ink-400` was 4.85:1 on the cream page and 4.42:1 on `cream-100`; at night
`ink-500` was 5.47:1 on the navy page and 3.82:1 on an elevated navy card.
Same story for `--text-dark-3` (0.40 alpha → 2.46:1) and `--text-light-3`
(0.44 → 3.6:1). Every ink step is now chosen against the worst surface it
lands on, and `globals.css` says so.

### The fill-vs-ink split had a missing third case

`--gold-ink` is gold deepened until it reads on **cream**. Put on a painted
navy band it runs 2.2–3.0:1, and it was on six of them. Added
`--color-gold-on-dark` (the fill, under a name that says where it belongs),
theme-invariant for the same reason `--on-accent` is: a navy band is navy in
both themes. `--gold-ink` itself was 4.49:1, not the 4.5 it claimed; now
`#7f6200`, 5.1:1.

The mirror of that bug: ink that flips on a plate that does not. 18 `bg-white`
literals left theme-aware ink stranded on a white plate at 1.1–2.6:1 at night
— all now `--panel-elevated`, which is the same `#ffffff` in light. The
`rare`/`epic` rarity badges put `gold-700` (which flips to `#FFD200`) on
`gold-100` (which does not): 1.3:1.

### The guard could not see the homepage

`scripts/check-brand.mjs` walked `.tsx/.css/.mdx`. The homepage body is
`content/home-body.html`, which it never opened — and which still held **34
literal colours**, among them `#F08A3C` and `#1E1410`, the retired
orange-500 and warm-black. They shipped on the homepage every day while the
guard reported the brand clean. It walks `.html` now, and the pocket is gone:
classmate avatars and map pins use the brand hues, the grade histogram is one
series in one colour instead of four retired ones, and the five guide tags are
one gold pill instead of five terracottas at 1.38:1.

### Repaint leftovers, now finished

- The retirement of the serif italic had been applied to `h1 em` and missed
  `.feat-hed em`, `.live-h em`, `.close-h em` and the guides watermark — the
  homepage was speaking in two voices. One voice now.
- `.brand-mark` was `linear-gradient(gold, gold)` — a flat colour written as a
  gradient — with cream ink on it. The wordmark's "L" was **1.1:1** in the
  header of every marketing page.
- `.section-dark` painted its navy with three stacked gradients and no
  `background-color`, breaking the "nothing is a gradient" rule and making the
  band invisible to anything resolving a ground by walking ancestors. That is
  where five 1:1 readings came from.

### Result

**0 failing pairings**, 14/14 green, three consecutive runs against a fresh
production build. `docs/brand-guidelines.md` — which described Space Grotesk,
Fraunces italic and an orange accent, none of which had been true since the
repaint — is rewritten against what the code does.

### Known broken — start here

- ~~**`npm run lint` exits 1**~~ — fixed the same day. `eslint.config.mjs`
  now drives the ESLint CLI. Chasing the 15 `no-explicit-any` it reported
  turned up the reason: `@supabase/ssr` 0.5.2 collapsed every row type to
  `never`, so `types/database.ts` was protecting nothing at any call site.
  Bumped to 0.7.0, the minimum version that fixes it.
- **The `seo` workflow has failed on every run since 9 August.** It starts a
  production server with no Supabase env, so middleware throws on every
  request and `wait-on` times out — meaning the SEO golden diff and the
  Lighthouse seo/accessibility gates have never actually executed. The same
  shape as the problem above: a guard with no working mechanism behind it.
- **`--text-dark-*` / `--text-light-*` are still misnamed.** They mean "ink
  for a dark band" and "ink for a light band", but read as theme names, and
  `--text-dark-3` is now defined in both `:root` and the homepage `.dark`
  block with opposite senses. The values are correct; the names invite the
  next bug. ~40 call sites.
- **Status colours are not in the system.** `/admin` still uses stock
  Tailwind `emerald`/`rose`/`sky`/`stone` — 56 call sites, internal screens
  only, no contrast failures. Needs semantic tokens before it is worth
  touching.
- **Visual baselines still not generated.** `e2e/visual.spec.ts` has **zero**
  committed snapshots despite its docstring saying they are committed, so it
  passes by writing new ones. Generate them in CI's Linux container — macOS
  baselines will not match.
- `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_ID` repo secrets are still
  unset, so CI's schema-drift job **skips** rather than fails.

## [2026-09-15] — Align the site to the app's navy / cream / gold, and build the guards that keep it there

Repainted LagoonWeb onto the iOS app's 2026-09 system (navy `#001E30`,
cream `#F4F1EA`, gold `#FFD200`) and, because three separate colour
sweeps shipped visibly-wrong output during this work, added two
mechanisms that catch the two different ways it went wrong.

**Status: the repaint is NOT finished.** Tokens are correct; the
homepage composition is not. See "Known broken" below before continuing.

### The single root cause, stated once

Almost every fault this session was the same shape: *a brand colour placed
too close to, or blended into, the surface it sits on.* Gold is a **fill**,
not a text colour — `#FFD200` on cream is 1.3:1. That produced the
fill-vs-ink token split: `--color-on-accent` (navy ink for text on a
painted gold plate) and `--color-gold-ink` (`#8A6A00`, gold you can
actually read on cream).

### Colour is now sourced once

- `app/globals.css` `@theme static` is the only place a colour is
  defined: gold / navy / cream / ink scales, `--color-panel`,
  `--color-on-accent`, `--chart-1..5` + `--chart-other`/`--chart-grid`,
  `--level-1..6`.
- `public/site.css` had **four** token blocks; merged to two (`:root`
  and `.dark`), all 53 tokens repointed at `@theme`.
- `lib/campus-buildings.ts`: 6 hand-picked pin colours → one `PIN`.
- `lib/gamification/levels.ts`: a rainbow → a **sequential** gold ramp.
  Rank is ordinal, so it is one hue getting brighter, not six unrelated
  hues.
- Chart series are not the brand fills. `#FFD200` is 1.29:1 on cream and
  `#003A60` reads as grey, so the five hues were re-stepped and validated
  (lightness band, chroma floor, CVD ΔE, normal-vision floor, contrast).
  Dark is a **selected** set, not a flip — the light steps leave violet at
  2.77:1 on navy.

### Two guards, because a linter cannot see this class of bug

`scripts/check-brand.mjs` fails the build on raw colour outside `@theme`,
and now also enforces three structural invariants learned the hard way:

1. **Literal fallbacks must not drift.** Every `var(--color-x, #hex)` in
   site.css is checked against `@theme`.
2. **Token chains must resolve.** A token defined as `var(--itself)` is
   invalid CSS, so every consumer silently drops to its fallback. The
   guard now follows `var()` chains and fails on a loop or a dangling ref.
3. **Theme-invariant tokens may not reference flipping names.** A
   `:root` token that `.dark` does not override is the same colour day
   and night, so it must not be built from a name `globals.css` flips.

`e2e/contrast.spec.ts` (Playwright) measures *rendered* contrast on
`/`, `/guides`, `/company`, `/hub` in both themes. A linter cannot catch
a pairing of two perfectly legal tokens; this can.

### Bugs this actually caught — the reason the guards exist

- **`/guides` shipped rendering fully black.** Tailwind **tree-shakes
  `@theme` variables no utility references**. Marketing routes use
  site.css class names, so their chunk stripped the variables and every
  `var(--color-x)` resolved to nothing. `@theme static` did *not* fix it.
  Fixed with literal fallbacks + drift enforcement (guard 1).
- **The app shell was never repainted, while CI stayed green.** Renaming
  `@theme`'s `orange-*` → `gold-*` silently *detached* 168 utility classes
  onto Tailwind's **built-in** `--color-orange-*` palette. `/hub` stayed
  fully orange and nothing failed.
- **Three self-referential tokens** (`--color-navy-700`, `--color-navy-600`,
  `--color-panel-elevated`, each `var(--itself)`) made `--color-panel`
  invalid inside `.dark`. Every card at night fell through to the *light*
  fallback — cream cards under cream ink, 1.07:1. One defect, all four
  `glass-panel`/`resource-row` failures. Now guard 2.
- **`--ink-light` inverted at night.** Cream ink for dark bands, defined as
  `var(--color-cream-50)` — a name `.dark` flips to the navy ramp. Cream
  labels on navy became navy-on-navy on any route that kept the variable;
  marketing routes tree-shook it and the fallback masked it. Now guard 3.
- **A duplicate `.announce-close`** in the homepage band sat *later* in the
  file than the canonical rule and reintroduced white-on-gold (1.31:1).
  The announce bar is gold in **both** themes, so its tag, link and close
  now wear `--on-accent`, never `--ink-light`.

### Measurement bugs — recorded because they cost more than the real bugs

Contrast auditing produced false results three times before it produced a
true one. Anyone extending the suite should know:

1. Measuring in a **detached iframe** returned nonsense — readable nav at
   1.23:1.
2. **No visibility filter**, so a closed hamburger menu was audited.
3. The big one: `c.match(/[\d.]+/g)` parsed Tailwind v4's
   `oklab(0.958 0.0004 0.0098 / 0.8)` as near-black RGB. Every colour is
   now normalized through a 1×1 canvas with alpha compositing.

A fourth landed while writing *this* entry: auditing `.dark` declarations
against the **light** `@theme` values reported 11 mismatches, of which 9
were false — `globals.css` deliberately flips the `cream-*`/`ink-*` names
to the navy ramp inside `.dark`. **Compare a `.dark` rule against the
`.dark` table, never the light one.**

### Known broken — start here

- **The homepage composition, not its tokens.** Tokens resolve correctly
  (cream ground, navy ink). But the homepage band's `--text-dark-*` family
  means *"ink for the dark hero"*, and the repaint turned that hero cream.
  So `--text-dark-3` now paints 40%-navy ghosts on a light ground
  (`.stat-lbl` 2.47:1) and gold floats on near-white with no navy mass to
  anchor it. The page reads flat and cheap. **This is a composition
  problem — re-establish a navy band, or retire the `--text-dark-*`
  aliases; do not just raise the alphas.**
- **Contrast suite: 8 passed / 6 failed.** All six are `/`, `/guides`,
  `/company`. The `/guides` dark failures are fixed; what remains is the
  homepage issue above plus `.brand-mark` ("L", 1.04:1).
- **Decide before "fixing":** `.ps-*` is a 7–8px **mock phone screen** and
  `.ls-item` a deliberately-ghosted marquee. These are pictures of a UI,
  not UI. They likely want `aria-hidden` and an audit skip, not more
  contrast — inflating them will wreck the mock.
- **Visual baselines were never generated.** `e2e/visual.spec.ts` exists;
  run `npx playwright test --update-snapshots` *after* the homepage is
  fixed, or the baselines pin the broken look.
- **Playwright is not wired into `.github/workflows/ci.yml`** yet.
- `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_ID` repo secrets are unset,
  so CI's schema-drift job **skips** rather than fails.

### Near-miss worth keeping

`app/api/` does not exist, and the leaderboard cron was nearly documented
as 404ing. Route groups do not affect URLs — the handler is at
`app/(app)/api/cron/refresh-leaderboard`, returns 401 unauthenticated, and
its RPC is present. Verify a route by requesting it, not by reading paths.

## [2026-05-15] — Marketing → one React/MDX system

Retired the hand-crafted static-HTML marketing system. Every marketing
URL is now a statically-prerendered React route in one Next app, so the
nav/footer/design live in one place instead of 28 copied files.
Architecture Rule 5 ("don't JSX-ify marketing") is intentionally
retired (ONBOARDING updated).

### Structure
- Route groups: `app/(app)/` (live app, GA `G-5HY7LBXP8G`) and
  `app/(marketing)/` (marketing, GA **`G-2F8CTN4DNP`** — kept on its own
  stream deliberately). Root layout slimmed; default metadata split per
  group so the app's keywords/appleWebApp/OG no longer leak onto
  marketing pages.
- Guides: MDX in `content/guides/<slug>.mdx` (frontmatter-driven
  `GuideShell` + markdown body + `Callout`/`ArticleLinks`/`Faq`
  components) with a `<slug>.jsonld.json` sidecar emitted verbatim, so
  structured data is byte-identical regardless of shape (full/lean
  Article, FAQPage). Served by `app/(marketing)/[slug]`.
- Home (`/`), `/guides`, `/company`: RSC routes; bodies kept as trusted
  first-party markup for pixel parity, CSS folded into a HOMEPAGE band
  in `site.css`, the scroll-reveal + live-stats ported to a small
  client component.

### Tooling / safety
- `scripts/seo-snapshot.mjs` — captures title/meta/canonical/JSON-LD
  goldens and diffs live pages (entity- and root-slash-normalized,
  scans whole doc for JSON-LD). `scripts/content-check.mjs` — body-prose
  fidelity guard. `scripts/migrate-*.mjs` — the one-shot converters.
- Verified end to end: all 28 pages SEO-identical to the pre-migration
  goldens, all 25 guides content-faithful, `tsc` + `next build` green
  (44/44 static; `/`, `/guides`, `/company` prerendered, guides SSG).
  Lighthouse not run in this environment, but every marketing page is
  static with no added client JS beyond a tiny reveal/stats hook, so
  the zero-JS profile is preserved.

### Deleted
- All 28 `web/public/marketing/*.html` and the `next.config.ts`
  static-rewrite machinery. `site.css` / `lagoon-cta.js` / OG images
  stay (now the marketing stylesheet/scripts/assets).

### Fixed
- The `(marketing)` layout now loads `site.css` (React-19 precedence
  hoist) — without it the migrated guides rendered unstyled.

## [2026-05-15] — One design language across marketing + app

Closed the visible seam between the hand-crafted marketing pages and
the Next.js app now that they share `lagoonucsb.com`. Three separately
maintained visual systems (home.html's bespoke inline CSS, site.css for
the 25 guide pages, globals.css for the app) reconciled onto one
source-of-truth token set, documented in `docs/brand-guidelines.md`.

### Design tokens (Phase 1)
- site.css + home.html aligned to the app's cream/orange palette
  (page bg `#F2F1EF`→`#faf6ee`, ink, borders), shared dotted body
  texture, focus + selection styles.
- Gave the 25 light-only guide pages a `prefers-color-scheme: dark`
  variant matching home.html + the app's `.dark` palette — a dark-OS
  user no longer gets dark home/app but light guides.

### Shared chrome (Phase 2)
- Marketing header now matches the app navbar: gradient amber→orange
  "L" tile, ink wordmark + uppercase overline, orange "Get the App"
  pill, 64px height, cream-50/85 backdrop (site.css + home.html).
- Marketing footer moved off the near-black strip onto the unified
  cream surface with matching brand tile + orange CTA; tokenized for
  dark mode.
- Recolored the injected related-guides / updated-date blocks in all
  25 guides from the old UCSB-navy palette to shared CSS vars.
- footer.tsx: fixed the dead `app.lagoonucsb.com/captains` link.

### Professionalism (Phase 3)
- Unified button language onto the app's solid-orange pill; card
  radius normalized to 1.25rem; every leftover cold-blue gradient in
  site.css recolored warm; nav CTA no longer wraps on mobile.

### SEO (Phase 4)
- Added Twitter cards + BreadcrumbList JSON-LD to the 9 pages built
  from an older template (og:image dims too); all JSON-LD validated.
- sitemap.ts: dropped `/login` (robots.ts disallows it) so the
  sitemap and robots no longer disagree.

Verified: `tsc --noEmit` clean, `next build` passes (16/16), and the
marketing ⟷ app surfaces spot-checked in light and dark.

## [2026-05-15] — Mission Control: feedback, growth analytics, handbook

Turned `/admin` into a real internal ops portal, modeled on how Linear /
Vercel / Raycast run their internal dashboards.

### Feedback system (new)
- `feedback` table (migration `20260515120000_feedback.sql`) — kind/status
  workflow, pin, admin notes, RLS anon-insert only.
- Floating **"Feedback"** widget on every Next.js route (`FeedbackWidget`):
  kind picker (idea/bug/praise/question), message, optional email, honeypot,
  success state. The pattern every leading app ships.
- `POST /api/feedback` intake (validation, honeypot, audit log, best-effort
  insert, never 500s on the user).
- `/admin/feedback` triage inbox: status filter chips, kind badges, pin to
  top, mailto reply, `PATCH /api/admin/feedback/[id]`.

### Growth analytics (new, real data)
- `/admin` now leads with a **Growth** section sourced from `user_profiles`:
  total users, new in 7d/30d, onboarding-completion %, referred-signup %,
  and a 14-day new-signup chart.
- Feedback summary card (open count, by-kind, recent 4) in the sidebar.

### Team onboarding (new)
- `ONBOARDING.md` at repo root — zero-to-shipping doc (architecture, env
  vars, deploy, migration process, growth model, first-week checklist).
- `/admin/handbook` renders it in-app via a dependency-free Markdown
  renderer (`lib/mini-markdown.tsx`). Bundled into the lambda via
  `outputFileTracingIncludes`.

### Admin bar + nav
- Admin bar gains a live **New feedback** counter (pulses when > 0) and
  Feedback / Handbook quick links.
- `/admin` header gains Feedback (with unread badge) + Handbook buttons.

### Fixes
- Marketing homepage links (Live data / map / stats / brand) were still
  hardcoded to `app.lagoonucsb.com`, breaking now that it's one project.
  Rewritten to relative paths (`/stats`, `/map`, `/hub`, `/api/public/stats`).
  Removed now-dead cross-origin preconnect hints.

## [2026-05-15] — Site consolidation: one project, one domain

Merged the previously-separate marketing site (lagoonucsb.com — static HTML
in repo root) and the Next.js web app (app.lagoonucsb.com — `web/`) into a
single deployable.

### What changed
- Moved all 27 hand-crafted marketing pages into `web/public/marketing/` as
  flat `<slug>.html` files. Hand-crafted CSS/structured-data preserved
  verbatim — no JSX port. Served via Next.js rewrites in `web/next.config.ts`.
- Moved `site.css`, `lagoon-cta.js`, `og-card.png`, `og-card.svg`,
  `logo-amber.svg`, `llms.txt` into `web/public/` so root-relative asset
  paths resolve unchanged.
- Moved the live dashboard (formerly `/`) to `/hub`. Root path now serves
  the marketing homepage via a rewrite.
- Added `Hub` link to the navbar so signed-in users can reach the dashboard.
- Sitemap + robots updated: canonical host is now `lagoonucsb.com` (not
  the subdomain). Sitemap includes all 27 marketing slugs + interactive
  routes.
- `metadataBase`, OG URLs, Apple Smart Banner `app-argument` all point at
  `lagoonucsb.com`.

### Deleted
- 27 directory-style marketing pages from repo root.
- Root-level `site.css`, `og-card.*`, `lagoon-cta.js`, `robots.txt`,
  `sitemap.xml`, `llms.txt`, `logo.svg`, `logo-amber.svg`.
- Root `vercel.json` (was for the old marketing-only Vercel project).
- Root `package.json` / `package-lock.json` (were empty stubs).

### Required follow-up
- In Vercel: add `lagoonucsb.com` (and `www.lagoonucsb.com`) as production
  domain aliases on the **app** project. Remove them from the old marketing
  project, then delete that project.
- Once the alias swap propagates (~minutes), the old marketing-project
  redirects to `app.lagoonucsb.com` are no longer needed (they'd be
  unreachable anyway since the marketing project is gone).
- `app.lagoonucsb.com` can either stay as a permanent alias (recommended
  for backward compatibility with already-shared links) or be retired.

## [2026-05-14] — Growth funnel + captain program

### Marketing site (lagoonucsb.com)
- **OG previews fixed** — `og-card.png` (1200×630) replaces the SVG that was breaking
  iMessage/Slack/Discord/Twitter previews across the homepage and 25 guide pages.
  Added `og:image:width/height` and refreshed the JSON-LD image references.
- **Apple Smart Banner** (`<meta name="apple-itunes-app">`) on every page —
  iOS Safari shows the native INSTALL/OPEN bar over the site.
- **Sticky CTA + GA4 conversion tracking** (`lagoon-cta.js`) auto-loads on every
  page. Tracks `app_store_click` with a `cta_source` attribution dimension
  (nav, hero, features, dl-badge, footer, sticky-guide, related-guides…),
  plus `scroll_depth`, `form_submit`, `sticky_cta_shown/dismiss`, and a `conversion`
  event for GA4 key-event configuration.
- **Internal-linking pass** — "Related guides" block injected into all 25 UCSB
  guide pages, picking 5 contextual siblings via topic clusters
  (`scripts/add-related-guides.py`, idempotent).
- **Freshness signal** — visible "Updated: May 2026" stamp + `dateModified` JSON-LD
  Article schema on every guide (`scripts/add-updated-date.py`, idempotent).
- **Outreach playbook** — `outreach-templates.md` adds ready-to-send copy for
  Daily Nexus pitch, IG captain DM (short/long), r/UCSB seeding post, 4-email
  waitlist nurture sequence, 10 TikTok hooks, 4 Meta ad creative briefs.

### Web app (app.lagoonucsb.com)
- **Design polish**:
  - Navbar: real gradient logo mark + stacked wordmark; scroll-aware shadow;
    proper mobile hamburger drawer; "Get the App" now drives to the App Store.
  - Footer: tinted CTA strip + 4-column link grid w/ cross-links to marketing
    guides; live-status row in the legal bar.
  - Homepage hero CTA → App Store with attribution; closing band adds a
    "Become a captain" secondary CTA.
- **Captain (ambassador) program** — new `/captains` landing page:
  hero + 6-perk grid + 3-step "how it works" + "you're probably a captain if…"
  section + 60-second application form + 5-question FAQ.
- **Referral attribution** — new `/r/[code]` route sets a 60-day `lagoon_ref`
  cookie and 302s to the App Store. `?noredirect=1` renders a SEO-indexable
  landing page that credits the captain by name.
- **Admin** — new gated `/admin/captains` dashboard:
  filterable list, status mutation buttons (Review / Accept / Reject / Archive),
  attribution chips, Instagram & email shortcuts. Gated by `ADMIN_EMAILS`
  env var + Supabase magic-link auth.
- **API** — `POST /api/captains` (form intake, validation, honeypot, cookie
  attribution, audit logging) and `PATCH /api/admin/captains/[id]` (admin-only
  status updates).
- **Parity** — Apple Smart Banner, GA4 conversion events, scroll-depth tracking,
  and referral cookie persistence now match the marketing site.
- **Assets** — `public/og.png`, `public/icon.png`, `public/apple-icon.png`,
  `public/logo.svg` filled in (the directory was empty before).

### Database
- New migration `web/supabase/migrations/20260514220000_captain_applications.sql`:
  `captain_applications` table with RLS (anon INSERT only), email regex check,
  status enum check, unique `lower(email)` index, status+timestamp index for
  the admin list, and a partial index on `referral_code` for measuring captain
  attribution. Trigger auto-stamps `reviewed_at` on first status change.

### Required follow-up
- Run `cd web && supabase link --project-ref <ref> && supabase db push` to apply
  migration 0004 to the production Supabase project, then `npm run db:types`.
- Set `ADMIN_EMAILS` env var in Vercel (comma-separated) to access `/admin/captains`.
- In GA4 → Admin → Events, mark `app_store_click` as a Key event.

---

## [2026-03-31] — Warm Editorial Redesign

### Summary
Full visual and copy overhaul to match the current iOS app design direction: warmer surfaces, editorial typography, and expanded feature storytelling.

### Design System
- **New palette**: Warm charcoal backgrounds (`#0b0906`), cream text (`#ede3d0`), terracotta (`#c4572a`), ochre (`#c98b2a`) — replacing the previous cold dark-blue SaaS palette
- **Typography**: `DM Serif Display` for all headings (h1/h2/h3) + `Manrope` for UI/body — creates warm editorial authority
- **Texture**: Subtle CSS SVG noise layer over the entire page for a paper/canvas feel
- **Removed**: All `output/*.png` app screenshots (low quality, not representative of current design)
- **Phone mockups**: Fully CSS-only, warm-themed screens (no images required)

### New Sections
- **Widgets section**: Shows an iPhone home screen with a Lagoon schedule widget, copy about lock screen utility
- **Native News reading section**: Shows the editorial Daily Nexus reading experience with serif-forward article cards, copy emphasizing it's no longer a web link
- **Social / Compare Schedules**: Updated share card with warm ochre/terracotta tones replacing the cold indigo palette

### Copy Updates
- Hero H1: "Campus life, *beautifully yours.*" (one clear emotional promise)
- Hero subtext: references GOLD, Carrillo, Storke Plaza, Daily Nexus by name
- All feature card descriptions are UCSB-specific (HSSB, De La Guerra, Phelps, Campbell Hall, etc.)
- CTA: "Try Lagoon on TestFlight." — direct, confident, action-oriented
- Marquee updated: added Widgets + Friends & Share Cards
- Stats: 37k Gauchos, 4 dining halls, 200+ events/month, 1 app

### Conversion
- All CTAs point to `https://testflight.apple.com/join/hfmrM9K7` (public beta)
- Nav CTA is now a clickable link to TestFlight (was just a badge)
- Trust chips below hero actions: "Public beta · available now", "Native iPhone app", "iOS 17+", "Free to join"

### Product Story Additions
- Schedule section now mentions widgets explicitly in card copy
- Daily Nexus described as "native reading experience" not a feed/link dump
- Campus Happenings renamed from "Campus Events" to match app language
- Social/Friends features labeled "Coming soon" to set accurate expectations

---

## [2026-03-30] — UCSB Copy Pass + Social Section

### Added
- Social "Compare Schedules" section with CSS share card mockup
- All feature card descriptions updated with UCSB-specific location names
- Stats updated to real UCSB scale: 37k Gauchos, 200+ events/month
- Marquee updated with Widgets and Friends items

---

## [2026-03-28] — Initial Site Build

### Added
- Full landing page: hero, marquee, features bento, stats, highlight, CTA, footer
- CSS-only phone mockups (Home, Dining, Schedule screens)
- Fonts: Sora + Manrope
- TestFlight link in nav and CTA
- Scroll reveal animations
- Mobile responsive layout
- `vercel.json` with `cleanUrls: true`
