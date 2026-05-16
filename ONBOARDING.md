# Lagoon — Team Onboarding

Welcome to the team. This is the single doc that gets you from zero to shipping.
Read it top to bottom once; bookmark it.

> Live version: **lagoonucsb.com/admin/handbook** (admin login required)

---

## 1. What Lagoon is

A free iOS app for UC Santa Barbara students — GOLD schedule sync, live dining
menus, grade distributions, campus events, Daily Nexus, a live friends map, and
gamified XP. Pre-launch → early growth. ~37k students is the whole market.

- **iOS app** repo: `~/Documents/GitHub/Lagoon` (Swift, separate)
- **Web** repo: `~/Documents/GitHub/LagoonWeb` (this one — marketing + web hub + admin)
- **Shared backend**: one Supabase project (`qecthmyzcicllttplhjq`)

## 2. The web repo at a glance

Everything is one Next.js 15 app in `web/`. There is no separate marketing site,
and no static-HTML marketing anymore — every marketing URL is a React route under
`web/app/(marketing)/`, statically prerendered. Guides are MDX in
`web/content/guides/`.

| Path | What it is |
|---|---|
| `/` | Marketing homepage (`app/(marketing)/page.tsx`; body `content/home-body.html`) |
| `/guides` `/company` | Marketing structure pages (`app/(marketing)/{guides,company}/`) |
| `/ucsb-dining-menu`, +24 guides | SEO guides — MDX `content/guides/<slug>.mdx`, served by `app/(marketing)/[slug]` |
| `/hub` | Live dashboard (XP, leaderboard, activity) — was `/` before the merge |
| `/leaderboard` `/stats` `/map` `/me` `/challenges` | Next.js app routes |
| `/captains` | Captain (ambassador) program landing + application form |
| `/r/[code]` | Referral redirect — sets cookie, logs click, 302 → App Store |
| `/admin` | Mission Control (growth, funnel, feedback, captains) |
| `/admin/captains` | Captain application triage |
| `/admin/feedback` | Product feedback inbox |
| `/admin/handbook` | This document, rendered in-app |

## 3. Local setup (10 minutes)

```bash
cd ~/Documents/GitHub/LagoonWeb/web
cp .env.example .env.local        # ask a teammate for values
npm install
npm run dev                       # http://localhost:3000
```

Required env vars (`.env.local`):

| Var | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public client key | same |
| `SUPABASE_SERVICE_ROLE_KEY` | admin reads (bypasses RLS) | same — **server-only, never commit** |
| `ADMIN_EMAILS` | comma-list of admin emails | you decide |
| `RESEND_API_KEY` | auto-send captain accept emails (optional) | resend.com → API keys |
| `RESEND_FROM` | verified sender, e.g. `Lagoon <team@lagoonucsb.com>` | Resend → Domains |

## 4. How to deploy

Push to `main` → Vercel auto-deploys. That's it. There is one Vercel project;
`lagoonucsb.com`, `www.lagoonucsb.com`, and `app.lagoonucsb.com` all point at it.

- Migrations are **not** auto-applied. See §6.
- Env var changes require a manual redeploy (Vercel → Deployments → ⋯ → Redeploy).

## 5. Architecture rules (don't break these)

1. **Admin routes are gated twice**: Supabase magic-link session **and** email in
   `ADMIN_EMAILS`. Never query admin data with the anon client — use
   `createAdminClient()` from `lib/supabase/admin.ts` (service role).
2. **Public write tables use RLS anon-insert only** (`captain_applications`,
   `feedback`, `referral_clicks`). Reads are service-role. Follow that pattern
   for any new intake table.
3. **Never lose user input to a 500.** Intake APIs always `console.log` the
   payload before the DB insert and return `ok` even if the insert fails.
4. **The iOS app owns the core schema.** Web migrations are additive only and
   live in `web/supabase/migrations/` with timestamped filenames.
5. **Marketing is React/MDX, statically prerendered, on its own GA stream.**
   Guides: `content/guides/<slug>.mdx` (frontmatter) + a `<slug>.jsonld.json`
   sidecar holding the structured data verbatim. Home/guides/company bodies:
   `content/*-body.html`. Marketing reports to GA `G-2F8CTN4DNP` (the
   `(marketing)` layout) — the app uses `G-5HY7LBXP8G`; don't merge them.
   Before shipping any marketing change run `cd web && node
   scripts/seo-snapshot.mjs check <url>` — it diffs title/meta/canonical/
   JSON-LD against captured goldens and must stay green.
6. **The web reads iOS-owned tables — keep them in sync.** See §5b.

## 5b. Cross-repo schema dependency ⚠️

The growth analytics on `/admin` read directly from **`user_profiles`**, which
is owned and migrated by the **iOS app repo** (`~/Documents/GitHub/Lagoon`),
not this one. Specifically we depend on these columns:

| Column | Used for |
|---|---|
| `created_at` | total users, new 7d/30d, signup chart |
| `onboarding_completed_at` | onboarding-completion % |
| `referred_by_user_id` | referred-signup % |

These reads are **best-effort by design**: if a column is renamed or removed
on the iOS side, the affected growth card silently shows **0** instead of
throwing. That keeps `/admin` from crashing — but it also means a schema
change can quietly zero out a metric with no error anywhere.

**If you work on the iOS repo:** before renaming/removing any of the columns
above on `user_profiles`, grep this repo for the old name
(`web/app/admin/page.tsx`, `web/components/admin-bar.tsx`) and update the
queries in the same release. Add this to the iOS-side migration checklist.

**If a growth card reads 0 unexpectedly:** first suspect a `user_profiles`
schema change upstream, not a bug here. Confirm with:
`select column_name from information_schema.columns where table_name='user_profiles';`

## 6. Applying a database migration

The Supabase CLI can't reconcile history (the iOS repo owns most migrations),
so apply new web migrations via the dashboard:

1. Open https://supabase.com/dashboard/project/qecthmyzcicllttplhjq/sql/new
2. Paste the new file from `web/supabase/migrations/`
3. Run
4. `cd web && npm run db:types` to regenerate `types/database.ts`, commit it

**Pending migrations to apply (one-time, in order):**

| File | Powers | Symptom if missing |
|---|---|---|
| `20260514220000_captain_applications.sql` | `/captains` + `/admin/captains` | captain apply 500s |
| `20260514230000_captain_program_v2.sql` | captain codes, referral clicks, funnel | funnel/clicks read 0 |
| `20260515120000_feedback.sql` | feedback widget + `/admin/feedback` | "feedback isn't set up" card |

Pages degrade gracefully (friendly setup cards, never a crash) until these
run — submissions are still captured in Vercel logs in the meantime.

## 6b. Supabase Auth URL configuration (one-time) ⚠️

If magic-link sign-in always bounces to `app.lagoonucsb.com` regardless of
where you started, the Supabase Auth allowlist is wrong. The code is correct
(`window.location.origin`); Supabase silently falls back to **Site URL** when
the requested redirect isn't allowlisted.

Fix at **Auth → URL Configuration**
(`https://supabase.com/dashboard/project/qecthmyzcicllttplhjq/auth/url-configuration`):

- **Site URL**: `https://lagoonucsb.com`
- **Redirect URLs** (add all):
  ```
  https://lagoonucsb.com/**
  https://app.lagoonucsb.com/**
  http://localhost:3000/**
  ```

After saving, new magic links return to the domain the user started on.

## 7. Growth model (how we actually grow)

UCSB is a closed 37k-student community in a 4-square-mile bubble. Paid ads lose
to peer recommendation here. The engine:

```
Captain shares /r/CODE → click logged + cookie set → App Store →
  install → (some) apply at /captains → admin accepts →
  new captain code minted + welcome email → repeat
```

Everything is measured on **/admin**: signups, onboarding %, the captain
funnel (clicks → applications → accepted), referral attribution, and the
feedback inbox. If a number is flat, that's the week's problem to solve.

Outreach copy (Daily Nexus pitch, captain DMs, r/UCSB post, email sequence,
TikTok hooks, Meta ad briefs) lives in `docs/outreach-templates.md`.

## 8. Where to look when…

| You want to… | Go to |
|---|---|
| See growth + what needs work | `/admin` |
| Triage a captain application | `/admin/captains` |
| Read user feedback | `/admin/feedback` |
| Understand the growth plan | `docs/strategy.md`, `docs/outreach-templates.md` |
| Change SEO copy on a guide | `web/content/guides/<slug>.mdx` (frontmatter) |
| Add an admin metric | `web/app/admin/page.tsx` |
| Change the captain email | `web/lib/email.ts` |

## 9. First week checklist

- [ ] Local dev running, can sign in via magic link
- [ ] Added to `ADMIN_EMAILS`, can load `/admin`
- [ ] Read `docs/strategy.md` + `docs/outreach-templates.md`
- [ ] Submitted a test feedback via the floating widget, found it in `/admin/feedback`
- [ ] Walked the captain loop: visit `/r/test`, apply at `/captains`, accept it in `/admin/captains`
- [ ] Shipped one small PR to `main`
