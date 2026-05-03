# Gamification

The whole system is built around a **single ledger** (`xp_events`) and a
**single grant function** (`grant_xp`). Everything else — levels, badges,
leaderboards, challenges, streaks — is a projection.

## XP values (current)

| Action          | XP   | Notes                                    |
|-----------------|------|------------------------------------------|
| `login`         | 5    | Cap once per day in calling code.        |
| `checkin`       | 15   | Server-side distance check on lat/lng.   |
| `rating`        | 10   | Unique per `ref_id` (one rating / spot). |
| `event_attend`  | 25   | Verified by RSVP + check-in geo.         |
| `event_create`  | 40   | Throttled — 3 / week.                    |
| `referral`      | 100  | Awarded after invitee earns 50 XP.       |
| `challenge`     | 50   | Plus the challenge's own `xp_reward`.    |

Defaults are encoded in the `grant_xp` SQL function. Tweak there, not in app
code, so mobile + web stay in lock-step.

## Levels

| Rank | Name           | Min XP | Emoji |
|------|----------------|--------|-------|
| 1    | Tadpole        | 0      | 🐸    |
| 2    | Minnow         | 100    | 🐟    |
| 3    | Dolphin        | 400    | 🐬    |
| 4    | Sea Otter      | 1,000  | 🦦    |
| 5    | Shark          | 2,500  | 🦈    |
| 6    | Lagoon Legend  | 6,000  | 👑    |

Defined in two places — keep them in sync:
- SQL: `level_for_xp()` in the migration
- TS: `LEVELS` in `lib/gamification/levels.ts`

A future improvement: derive the TS table at build time from the SQL function.

## Badges (starter set)

Stored as rows in the `badges` table. Each has a JSON `criteria`:

```json
{ "kind": "checkin", "count": 10 }   // 10 of any specific event kind
{ "total_xp": 6000 }                 // lifetime XP threshold
{ "streak": 7 }                      // longest streak threshold
```

`evaluate_badges(user_id)` checks all of them after every event insert. It's
idempotent, so retroactive grants Just Work.

## Streaks

A streak is the count of distinct UTC days with at least one `xp_event`. The
trigger updates `current_streak` when a new event arrives:

- New event today, last_active was yesterday → `+1`
- New event today, last_active was today → unchanged
- Otherwise → reset to `1`

This means **streaks update in real time as you act**, not at midnight.
A nightly cron isn't required.

## Weekly leaderboard

`leaderboard_weekly` is a materialized view, refreshed every 5 minutes by
`/api/cron/refresh-leaderboard`. Concurrent refresh keeps reads non-blocking.

For the **last 24h of a week**, you might want sub-minute freshness. The
homepage already overlays the live activity feed, so most students see fresh
data without us paying for sub-minute leaderboard refreshes.

## Weekly challenges

A row in `weekly_challenges` per Monday:

```sql
insert into public.weekly_challenges
  (week_start, slug, title, description, target_kind, target_count, xp_reward)
values
  (date_trunc('week', now())::date, 'dining-tour', 'Dining Tour',
   'Rate every dining hall this week.', 'rating', 4, 75);
```

The `on_xp_event_for_challenge` trigger bumps progress automatically. When
`progress >= target_count`, `completed_at` fills in and the bonus
`xp_reward` is granted (in a follow-on insert from app code on completion).

## Anti-spam

- `unique(user_id, kind, ref_table, ref_id)` blocks duplicate credit.
- `grant_xp()` is `security definer` — clients can't change point values.
- For check-ins specifically, app code should distance-check coordinates
  before calling `grant_xp('checkin', 'spots', '<spot-id>')`. The mobile app
  is the right place for that (it has GPS); the web client should not award
  check-ins.

## How a 50-user community feels alive

With ~54 active users, raw leaderboards look thin. Mitigations baked in:

- **Activity feed** on the homepage — every action is visible immediately.
- **Bucketed leaderboards** (by college/dorm/crew) — smaller groups, real competition.
- **Vibe meter** — visible motion even when individual events are sparse.
- **Weekly recap pages** — even a quiet week becomes a shareable artifact.
