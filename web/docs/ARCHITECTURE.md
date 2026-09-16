# Architecture

> Rewritten 2026-09-15. The previous version described a system that had
> drifted: two sites on two domains, an `xp_events` table, and a `grant_xp()`
> write path. None of those exist. Corrections are called out inline so the
> drift is visible rather than quietly patched.

## What this is, honestly

One Next.js 15 app on Vercel, reading a Supabase Postgres that the **iOS app
owns**. Roughly 130 signups. Nothing here is throughput-constrained and
nothing needs to be: the binding constraint is **how fast one person can
change it without breaking something**, and the design below is argued on that
basis, not on load.

If that changes — if a week-zero push lands thousands of students at once —
the section "When scale actually arrives" says what to do and in what order.
Doing any of it sooner is cost without benefit.

## High level

```
                      lagoonucsb.com  (one Vercel project, one domain)
      ┌──────────────────────────────────────────────────────────────┐
      │  app/(marketing)/         │  app/(app)/                      │
      │  public, ISR              │  signed-in + public dashboards   │
      │  / schedule guides go     │  /hub /stats /leaderboard        │
      │  friends wrapped company  │  /captains /map /me /admin       │
      │  styled by public/site.css│  styled by Tailwind @theme       │
      └───────────┬──────────────────────────┬───────────────────────┘
                  │ Server Components → lib/queries.ts
                  │ supabase-js, anon key, RLS-gated
                  ▼                          ▼
      ┌────────────────────────┐   app/(app)/api/*  (route handlers)
      │  Supabase Postgres     │   ├ cron/refresh-leaderboard  (service role)
      │  Auth · RLS · Realtime │   ├ captains, feedback        (public writes)
      └───────────┬────────────┘   └ admin/*                   (service role)
                  │
                  ▼
      ┌────────────────────────┐
      │  Lagoon iOS app        │  ← owns the schema (60+ migrations)
      └────────────────────────┘
```

**Correction.** The old diagram showed `lagoonucsb.com` as a static marketing
site and `app.lagoonucsb.com` as a separate Next app. There is one app and one
domain; marketing became React/MDX under `app/(marketing)/` and `home.html` is
gone. Anything still written as if there are two deployables is stale.

## The actual architectural problem: two styling systems

This is the one worth fixing, and it is not in the data layer.

| | lines | loaded by | consumed as |
|---|---|---|---|
| `public/site.css` | 2977 | `<link>` in the marketing layout | hand-written class names |
| `app/globals.css` | 316 | imported by the root layout | Tailwind v4 `@theme` tokens |

Both define the brand. They are supposed to be kept in sync by hand — the brand
doc says "if you change a token, change it in **both** places in the same
commit." That instruction is the smell: it is a consistency requirement with no
mechanism behind it.

What it cost in practice, during the 2026-09 repaint:

1. `site.css` declares `:root` **three times** — top of file, a HOMEPAGE band
   folded in from the old `home.html`, and a `.dark` block, plus a second
   `.dark` inside the homepage band. Same specificity, so the last one wins.
   Repainting the first block changed nothing visible and looked like a caching
   problem for two rounds.
2. Renaming the Tailwind scale from `orange-*` to `gold-*` did not repaint the
   168 utility classes using it — it **detached** them. Tailwind v4 emits
   `--color-orange-*` from its own default palette, so every `bg-orange-500`
   silently fell through to Tailwind's orange. The build passed, typecheck
   passed, and the app shell looked untouched while the tokens underneath had
   moved. That is the worst failure mode available: green CI, wrong output.
3. 162 colour values lived in neither system — literals in rules that never
   went through a token at all.

**Target:** one source of truth, `@theme` in `globals.css`, with `site.css`
reduced to layout/component rules that reference those tokens and nothing else.

**Status: done (2026-09-15).** `site.css` declared its tokens in **four**
blocks — two `:root` and two `.dark` — with the later ones silently winning.
They are now one `:root` and one `.dark`, holding no colour of their own: every
token resolves from `@theme`, including the ~120 legacy `--orange-*` aliases
the homepage rules still reference. `@theme` is the only place a colour is
defined, and `scripts/check-brand.mjs` fails the build if that stops being
true.

Running the guard for the first time found 114 raw colours that three
hand-passes had missed — warm browns still inside `.dark` component rules, the
pre-repaint app palette embedded in chart fallbacks, and six more white-on-gold
labels at 1.4:1. That is the argument for the guard in one number.

What it also surfaced, which no colour sweep would have:

- **The campus map painted six categories in six colours that can't be told
  apart** — teal↔violet was ΔE 14.4 for *normal* vision, and coral↔gold ΔE 0.7
  under deuteranopia. Six categorical hues that separate pairwise is not
  achievable. Every pin already carries an emoji and a label, so the colour was
  redundant encoding implying a distinction the eye could not make. One pin
  colour now; the emoji is the identity.
- **Level ranks were a rainbow** (cyan, cyan, cyan, green, pink, yellow) for
  ranks 1–6. Rank is *ordinal*; a rainbow reads as six unrelated categories and
  hides the ordering. It is one gold hue getting brighter now.

Porting marketing sections from `site.css` to Tailwind stays opportunistic —
do it when a section is touched. A 2977-line rewrite still risks more than it
fixes, and the guard means the file can no longer drift while it waits.

## Request flow

**Reads.** Server Components call `lib/queries.ts` (323 lines, the single data
access layer — keep it that way). Each page declares an explicit cache window.
Anything needing a live socket subscribes from a `"use client"` component
layered on the SSR'd snapshot.

**Writes.** Route handlers under `app/(app)/api/`. Public writes (captain
applications, feedback) use the anon key behind RLS; admin mutations and the
cron use the service-role key, which never reaches the browser.

> **Correction.** The old doc said writes call `grant_xp(kind, ref_table,
> ref_id)` and "never insert into `xp_events` directly." Neither exists: the
> table is `user_xp_events`, and `grant_xp` appears nowhere in either repo.
> XP is written by the iOS app (app-repo migration `032_gamification_*`).
> **The web does not write XP at all** — and that is the right boundary, so the
> rule should be stated as one: *XP is the mobile app's to grant; the web
> reads it.*

**Cron.** `vercel.json` schedules `/api/cron/refresh-leaderboard` daily at
07:00 UTC, which calls the `refresh_leaderboard_weekly()` RPC to rebuild the
`leaderboard_weekly` materialized view. Verified present and guarded (401
without the secret). Route groups don't affect URLs, so a handler living at
`app/(app)/api/...` still serves `/api/...` — worth knowing before concluding
it's missing.

## Caching

| Page | Strategy | Why |
|---|---|---|
| `/` and marketing | ISR | Content changes on deploy, not per request |
| `/leaderboard` | `revalidate: 60` | Reads a matview the cron rebuilds daily |
| `/challenges` | `revalidate: 60` | Changes about once a week |
| `/hub`, `/stats` | ISR + realtime overlay | Snapshot is fine; the feed is live |
| `/me`, `/admin/*`, `/map` | `force-dynamic` | Personal or privileged |

The one inconsistency worth naming: `/leaderboard` revalidates every 60s
against a view refreshed every 24h. The 60s window buys nothing — it just
re-serves the same rows. Either match the window to the matview (`revalidate:
3600`) or move the refresh to a trigger. Neither is urgent at this size; the
point is that the two numbers should be related, and right now they aren't.

## The schema boundary — the real coupling risk

The iOS repo owns the schema (60+ migrations). This repo adds 6 "additive"
migrations on top and otherwise **reads tables it does not own**.

That is a defensible split — one writer, one schema — but it has no
enforcement. A rename in the app repo breaks the website at runtime, not at
build time, and nothing tells you until a page 500s.

Cheap mitigations, in order of value per effort:

1. **Run `npm run db:types` in CI** against the real database. The generated
   types already exist; wiring them to fail the build turns a runtime 500 into
   a red check. This is the single highest-value item in this document.
2. Keep the list of app-owned tables the web reads in one place (`lib/queries.ts`
   already is that place — document it as the contract).
3. When a table the web depends on changes, treat it like an API change,
   because it is one.

## When scale actually arrives

Not now. In rough order of when each becomes real:

| Trigger | Move |
|---|---|
| Leaderboard reads dominate | The matview already exists — raise its refresh rate |
| Realtime channels get expensive | Fan out through one channel, not one per widget |
| Signups spike at week zero | Supabase connection pooling; nothing app-side |
| Read latency by region | Vercel edge + a read replica |

None of this is worth building ahead of the trigger. The cost of a premature
queue or cache tier here is paid every time one person tries to change a page.

## Trade-offs taken

| Decision | Why | What it costs |
|---|---|---|
| One Next app, not two deployables | One router, one auth session, one deploy | Marketing carries the app's JS baseline |
| Server Components + `lib/queries.ts` | No API layer to maintain for reads | Reads are coupled to Next's rendering model |
| Supabase RLS instead of an API tier | One less service; the mobile app already relies on it | Authorisation lives in SQL, which is harder to test |
| Schema owned by the iOS repo | One writer, no two-way migration conflicts | The web can break from a change in another repo |
| Keeping `site.css` for now | A 2977-line rewrite risks more than it fixes | Two styling systems until the sequence above lands |

## What I would revisit first

Three of the four originally listed here are now done — the brand guard, the
de-duplicated tokens, and CI type generation against the live schema
(`.github/workflows/ci.yml`, which skips rather than fails when the Supabase
secrets are absent, so forks stay green).

**Set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` as repo secrets.**
Until those exist the schema job skips, which means the highest-value guard in
this document is present but not yet armed. It is two secrets.

Remaining, in order:

1. **`/leaderboard`'s revalidate window.** 60s against a view the cron rebuilds
   every 24h. The number currently means nothing — match it to the matview or
   move the refresh to a trigger.
2. **Port marketing sections to Tailwind as they're touched.** Not a project.
3. **A visual regression check.** Four passes of this repaint shipped something
   that looked right and wasn't; the contrast bugs were only ever caught by
   measuring rendered pages. The brand guard catches raw colour, not a
   1.4:1 pairing. Playwright screenshots on the six main routes would close
   that gap, and it is the only item here worth real effort.
