# Architecture

## High-level

```
       ┌──────────────────────┐
       │  lagoonucsb.com      │   ← static marketing site (root of repo)
       └──────────────────────┘
       ┌──────────────────────┐
       │  app.lagoonucsb.com  │   ← Next.js 15 (this directory)
       └─────────┬────────────┘
                 │ supabase-js (anon key, RLS-gated)
                 ▼
       ┌──────────────────────┐        ┌──────────────────────┐
       │  Supabase Postgres   │◄──────►│  Lagoon mobile app   │
       │  + Auth + Realtime   │        └──────────────────────┘
       └──────────────────────┘
```

## Request flow

1. **Read paths** are Server Components calling `lib/queries.ts`. Each page
   declares an explicit `revalidate` window. Anything that needs a real socket
   subscribes from a `"use client"` component on top of the SSR'd snapshot.
2. **Write paths** call the `grant_xp(kind, ref_table, ref_id)` Postgres
   function — never insert into `xp_events` directly. The function is
   `security definer`, so it can enforce point values centrally and ignore
   client-side tampering.
3. **Cron paths** live under `/api/cron/*` and are invoked by Vercel Cron. They
   use the **service-role key** (never exposed to the browser) and run
   privileged maintenance like refreshing the materialized leaderboard.

## Caching strategy

| Page          | Strategy                              | Why                                |
|---------------|---------------------------------------|------------------------------------|
| `/`           | `revalidate: 30` + Realtime overlay   | Snapshot is fine, feed is live.    |
| `/leaderboard`| `revalidate: 60` (mat. view = cron)   | Already pre-aggregated.            |
| `/me`         | `dynamic = "force-dynamic"`           | Personal data, must be fresh.      |
| `/challenges` | `revalidate: 60`                      | Changes once per week.             |

## Realtime budget

We deliberately keep realtime small:

- **Activity feed** — INSERT subscription on `xp_events`, last 30 events.
- **(later) Leaderboard final hour** — same channel, only on the leaderboard page during weekly close-out.
- **(later) Vibe meter** — could subscribe; today it's a server-rendered count.

Pages that don't need realtime do **not** open a channel. Channels are torn
down on route change via `useEffect` cleanup.

## Auth

Magic-link via Supabase. The mobile app and web share one `auth.users` table,
so a student who signs up in either client gets a single profile row (created
by the `on_auth_user_created` trigger).

Server Components read the session from cookies via `@supabase/ssr`. The
`middleware.ts` refreshes expired tokens on every request.

## Why Next.js 15 (and not the static site)

The marketing site (`/index.html` etc.) lives at the root of the repo and ships
to `lagoonucsb.com`. It's intentionally untouched. The web app lives in `web/`
and ships to `app.lagoonucsb.com` as a **separate Vercel project** so the two
can be deployed independently.
