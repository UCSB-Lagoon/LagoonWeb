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

Everything is one Next.js 15 app in `web/`. There is no separate marketing site
anymore — static marketing pages are served from `web/public/marketing/` via
rewrites in `web/next.config.ts`.

| Path | What it is |
|---|---|
| `/` | Marketing homepage (hand-crafted HTML in `public/marketing/home.html`) |
| `/ucsb-dining-menu`, +24 guides | Static SEO pages (`public/marketing/<slug>.html`) |
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
5. **Marketing pages are hand-crafted HTML.** Don't JSX-ify them. Edit the HTML
   in `public/marketing/` directly; keep the inlined structured data.

## 6. Applying a database migration

The Supabase CLI can't reconcile history (the iOS repo owns most migrations),
so apply new web migrations via the dashboard:

1. Open https://supabase.com/dashboard/project/qecthmyzcicllttplhjq/sql/new
2. Paste the new file from `web/supabase/migrations/`
3. Run
4. `cd web && npm run db:types` to regenerate `types/database.ts`, commit it

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
TikTok hooks, Meta ad briefs) lives in `outreach-templates.md`.

## 8. Where to look when…

| You want to… | Go to |
|---|---|
| See growth + what needs work | `/admin` |
| Triage a captain application | `/admin/captains` |
| Read user feedback | `/admin/feedback` |
| Understand the growth plan | `strategy.md`, `outreach-templates.md` |
| Change SEO copy on a guide | `web/public/marketing/<slug>.html` |
| Add an admin metric | `web/app/admin/page.tsx` |
| Change the captain email | `web/lib/email.ts` |

## 9. First week checklist

- [ ] Local dev running, can sign in via magic link
- [ ] Added to `ADMIN_EMAILS`, can load `/admin`
- [ ] Read `strategy.md` + `outreach-templates.md`
- [ ] Submitted a test feedback via the floating widget, found it in `/admin/feedback`
- [ ] Walked the captain loop: visit `/r/test`, apply at `/captains`, accept it in `/admin/captains`
- [ ] Shipped one small PR to `main`
