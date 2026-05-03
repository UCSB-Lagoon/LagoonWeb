# Deployment

## Vercel — separate project from the marketing site

The marketing site (`lagoonucsb.com`) deploys from the **repo root**.
The web app deploys from the `web/` directory as a **second Vercel project**:

1. In Vercel, create a new project pointing at this repo.
2. Set **Root Directory** to `web`.
3. Framework preset: **Next.js**.
4. Domain: `app.lagoonucsb.com`.

Both projects share the same git repo but deploy independently. Pushing a
docs-only change to `web/docs/**` won't redeploy marketing, and vice versa.

## Environment variables

| Name                              | Where      | Purpose                                       |
|-----------------------------------|------------|-----------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`        | client+srv | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | client+srv | Anon key (safe to expose, RLS-gated)          |
| `SUPABASE_SERVICE_ROLE_KEY`       | **server** | Used by `/api/cron/*` only. Never to client.  |
| `CRON_SECRET`                     | server     | Bearer token Vercel Cron sends in headers.    |

Set these in Vercel → Project → Settings → Environment Variables. Mark the
service-role key and cron secret as **Secret** (server-only).

## Cron

`vercel.json` registers:

```json
{ "path": "/api/cron/refresh-leaderboard", "schedule": "*/5 * * * *" }
```

Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — the route rejects
anything else.

## Supabase

Same project as the mobile app. Apply the migration once:

```bash
cd web
npx supabase link --project-ref <YOUR_REF>
npx supabase db push
```

Or paste `supabase/migrations/0001_gamification.sql` into the SQL editor.

After it lands:

```bash
npm run db:types
```

…to regenerate `types/database.ts` from your live schema.

## Domain & redirects

In Supabase Auth → URL Configuration, add:

- Site URL: `https://app.lagoonucsb.com`
- Redirect URLs: `https://app.lagoonucsb.com/auth/callback`, plus `http://localhost:3000/auth/callback` for dev.
