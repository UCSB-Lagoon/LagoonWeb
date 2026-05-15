# Lagoon Web — Changelog

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
