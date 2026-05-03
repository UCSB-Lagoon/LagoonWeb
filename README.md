# Lagoon — UCSB

Two things live in this repo:

| Path        | What it is                                      | Deploys to                |
|-------------|--------------------------------------------------|---------------------------|
| **`/`**     | Static marketing & SEO site (HTML + CSS)         | `lagoonucsb.com`          |
| **`/web`**  | Next.js 15 + Supabase interactive web app        | `app.lagoonucsb.com`      |

Both deploy as separate Vercel projects from this single repo. They never
share build tooling, so the static site stays fast and the app can iterate
freely.

## The web app — UCSB Lagoon

A gamified central hub for UCSB student life: live ratings, weekly
leaderboards, badges, challenges, and a campus vibe meter. Companion to the
Lagoon mobile app (~54 active users) — same Supabase backend, same students,
new surface.

→ **See [`web/README.md`](./web/README.md) to get started.**

Key docs:
- [Architecture](./web/docs/ARCHITECTURE.md)
- [Database & RLS](./web/docs/DATABASE.md)
- [Gamification](./web/docs/GAMIFICATION.md)
- [Deployment](./web/docs/DEPLOYMENT.md)

## The marketing site

Plain HTML pages and content directories at the repo root. `vercel.json`
enables clean URLs. To preview locally:

```bash
npx serve .
```

## Structure

```
LagoonWeb/
├─ index.html, site.css, …              # marketing site
├─ ucsb-*/, how-to-*/, best-*/, …       # SEO content directories
├─ web/                                  # Next.js app (this is the new hotness)
│  ├─ app/   components/   lib/   docs/
│  └─ supabase/migrations/0001_gamification.sql
└─ README.md  ← you are here
```
