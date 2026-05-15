# LagoonWeb

The web presence for **Lagoon** — the free UCSB campus app. Marketing site,
live web hub, captain (ambassador) program, and internal Mission Control
admin, all in one Next.js project.

> **New to the team? Start with [`ONBOARDING.md`](./ONBOARDING.md).**
> It's the zero-to-shipping doc. Also rendered in-app at
> `lagoonucsb.com/admin/handbook` (admin login).

## Repo layout

```
LagoonWeb/
├── README.md            ← you are here
├── ONBOARDING.md        ← team handbook (read this first)
├── CHANGELOG.md         ← what changed, newest first
├── web/                 ← the app (Next.js 15 + Supabase). All code lives here.
│   ├── app/             ← routes (marketing rewrites, /hub, /admin, /captains, /r)
│   ├── components/      ← shared UI (navbar, footer, admin bar, widgets)
│   ├── lib/             ← supabase clients, email, helpers
│   ├── content/         ← onboarding.md (source for /admin/handbook)
│   ├── public/marketing/← hand-crafted static marketing + 25 SEO guide pages
│   └── supabase/        ← additive web migrations
├── docs/                ← strategy & planning (not shipped)
│   ├── strategy.md
│   ├── outreach-templates.md
│   ├── business-profile.md
│   ├── brand-guidelines.md
│   └── research/        ← market / community / expansion / SEO research
└── archive/             ← stale one-off scripts + legacy screenshots (history only)
```

## Quick start

```bash
cd web
cp .env.example .env.local      # ask a teammate for values
npm install
npm run dev                     # http://localhost:3000
```

Full setup, env vars, deploy process, architecture rules, and the growth
model are all in [`ONBOARDING.md`](./ONBOARDING.md).

## Deploy

Push to `main` → Vercel auto-deploys. One project serves `lagoonucsb.com`,
`www.lagoonucsb.com`, and `app.lagoonucsb.com`. Database migrations are
applied manually (see ONBOARDING §6).

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres, Auth,
RLS) · Recharts · Resend · Vercel.
