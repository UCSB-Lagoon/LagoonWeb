# Deployment guide

Two Vercel projects, same GitHub repo, different root directories. They build
and deploy independently.

| Project        | Root dir | Framework | Domain                  |
|----------------|----------|-----------|-------------------------|
| Marketing      | `/`      | Other     | `lagoonucsb.com`        |
| Lagoon (web)   | `/web`   | Next.js   | `app.lagoonucsb.com`    |

## 1 — Get the code on GitHub

```bash
git add .
git commit -m "Add Lagoon web app + stats"
git push
```

## 2 — Import the web app into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → pick `LagoonWeb`.
3. **Configure Project:**
   - **Project Name:** `lagoon-web` (anything you want)
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** click *Edit* → `web` ← critical
   - **Build Command:** leave default (`next build`)
   - **Output Directory:** leave default (`.next`)
   - **Install Command:** leave default
4. Expand **Environment Variables** and add these — copy values from
   Supabase → *Project Settings → API*:

   | Name                              | Where it goes  | Value                                      |
   |-----------------------------------|----------------|--------------------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`        | All envs       | `https://qecthmyzcicllttplhjq.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | All envs       | (anon public key — safe in browser)        |
   | `SUPABASE_SERVICE_ROLE_KEY`       | All envs ⚠️    | (service role key — **mark as Secret**)    |
   | `CRON_SECRET`                     | All envs       | any random string, e.g. `openssl rand -hex 32` |

5. Click **Deploy**. First build takes ~90 seconds.

## 3 — Connect the domain

You probably want the web app at `app.lagoonucsb.com` and keep
`lagoonucsb.com` pointing at the marketing site.

1. Open the new project → **Settings → Domains**.
2. Add **`app.lagoonucsb.com`**.
3. Vercel shows you a DNS record to add. At your DNS host
   (Namecheap / Cloudflare / wherever lagoonucsb.com lives):
   - **Type:** `CNAME`
   - **Name:** `app`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** Auto / 3600
4. Wait 1–10 min, then refresh Vercel's domain page until it shows green.

> **No domain yet?** Vercel gives you a free `*.vercel.app` URL like
> `lagoon-web-abcd.vercel.app`. Use that until DNS is ready — everything works
> the same.

## 4 — Update Supabase auth redirect URLs

Magic-link sign-in posts to `/auth/callback`. Tell Supabase about both URLs:

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL:** `https://app.lagoonucsb.com`
3. **Redirect URLs:** add both
   - `https://app.lagoonucsb.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

## 5 — Make the marketing site link here

Already done — [`index.html`](../../index.html) now has a **Live** entry in the
top nav pointing at `https://app.lagoonucsb.com`. Push the change and the
marketing project on Vercel will redeploy automatically.

If you'd rather the link be louder (a colored pill in the right side of the
nav), say the word and I'll restyle it.

## 6 — Cron (optional but recommended)

`vercel.json` registers a cron that refreshes the weekly leaderboard every
five minutes. Vercel auto-detects it on first deploy. Verify under
**Project → Settings → Cron Jobs** — you should see one entry. The job hits
`/api/cron/refresh-leaderboard` with `Authorization: Bearer $CRON_SECRET`.

## 7 — Troubleshooting

- **Build fails on `next: command not found`** → wrong root directory; make
  sure Vercel is set to `web`.
- **`Module not found: '@/...'`** → same; the path alias only resolves with
  the right root.
- **Empty leaderboard / activity feed** → migration hasn't been applied to
  the linked Supabase project. Run the SQL in
  `web/supabase/migrations/000{1,2}_*.sql` via the Supabase SQL editor.
- **"Not authenticated" on `/me`** → confirm the redirect URLs in step 4 and
  that cookies are enabled on the domain.
- **Realtime activity feed silent** → `user_xp_events` was added to the
  `supabase_realtime` publication by migration 0001; verify it exists in
  Supabase → *Database → Publications*.
