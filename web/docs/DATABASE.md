# Database

The full schema lives in [`supabase/migrations/0001_gamification.sql`](../supabase/migrations/0001_gamification.sql).
The migration is idempotent — re-running it on an existing project is safe.

## Tables

| Table                | Purpose                                                | Writable by         |
|----------------------|--------------------------------------------------------|---------------------|
| `profiles`           | Public profile per auth user                           | owner only          |
| `xp_events`          | Append-only XP ledger (single source of truth)         | only via `grant_xp` |
| `user_stats`         | Projection: total XP, level, streaks                   | trigger             |
| `badges`             | Catalog of badges + criteria (JSON)                    | admin               |
| `user_badges`        | Earned badges per user                                 | trigger             |
| `weekly_challenges`  | One row per challenge per week                         | admin               |
| `challenge_progress` | Per-user progress toward each challenge                | trigger             |
| `leaderboard_weekly` | Materialized view: ranked XP per week                  | cron refresh        |
| `crews`, `crew_members` | Optional team competition                           | members             |

## Why an event ledger

We never mutate a `points` counter on the user. Every action writes a row to
`xp_events`, and `user_stats` is rebuilt from the trigger. This gives us:

- **Auditability** — "where did my 35 XP yesterday come from?" is a query.
- **Anti-cheat** — `unique(user_id, kind, ref_table, ref_id)` blocks duplicate credit for the same target.
- **Replayability** — drop and rebuild `user_stats` from the ledger any time.
- **Future analytics** — every recap, streak, and badge is just a query over events.

## Row-Level Security

RLS is **on for every table**. Highlights:

- `profiles` — world-readable, owner-writable.
- `xp_events` — readable by the owner only. There is **no insert/update/delete policy**, so direct writes are impossible from the client. Use `grant_xp()`.
- `user_stats`, `badges`, `user_badges`, `weekly_challenges`, `crews` — world-readable. Needed for leaderboards and profiles.
- `challenge_progress` — owner-only.

The `activity_feed` view exposes the last 24h of `xp_events` joined with
`profiles`. It's a regular view (inherits caller's RLS) — combined with the
"read-own" policy on `xp_events`, you'd see nothing — so we explicitly `grant
select` to anon/authenticated. If you want to hide some kinds, filter in the
view definition.

## Triggers (the moving parts)

```
INSERT INTO xp_events
  ├─► on_xp_event_insert            (updates user_stats, streak, level)
  │     └─► evaluate_badges         (idempotent badge check)
  └─► on_xp_event_for_challenge     (bumps challenge_progress, completes if hit)
```

```
INSERT INTO auth.users (Supabase Auth)
  └─► handle_new_user               (creates profiles + user_stats rows)
```

## Functions

- `level_for_xp(xp int) → int` — pure, immutable. Mirrored in `lib/gamification/levels.ts`. **Keep them in sync.**
- `grant_xp(kind text, ref_table text, ref_id text) → int` — security-definer RPC; returns points awarded (0 if duplicate).
- `evaluate_badges(user_id uuid)` — idempotent; called by trigger.
- `refresh_leaderboard_weekly()` — refreshes the materialized view (cron).

## Adding a new badge

```sql
insert into public.badges (slug, name, description, icon, tier, criteria)
values ('coffee-snob', 'Coffee Snob', '20 ratings at coffee spots.', '☕', 'silver',
        '{"kind":"rating","count":20}')
on conflict (slug) do update
  set name = excluded.name, description = excluded.description,
      icon = excluded.icon, criteria = excluded.criteria;
```

Re-evaluate retroactively for everyone:

```sql
do $$
declare u uuid;
begin
  for u in select id from auth.users loop
    perform public.evaluate_badges(u);
  end loop;
end $$;
```

## Backfilling stats from the ledger

If `user_stats` ever drifts:

```sql
update public.user_stats s set
  total_xp = coalesce((select sum(points) from public.xp_events e where e.user_id = s.user_id), 0)
;
update public.user_stats set current_level = public.level_for_xp(total_xp);
```
