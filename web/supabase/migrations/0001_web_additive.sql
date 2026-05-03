-- ============================================================================
-- UCSB Lagoon — Web app additive migration
-- The mobile app already owns the core gamification schema:
--   user_profiles, user_gamification_profiles, user_xp_events,
--   badge_catalog, user_badges, user_badge_progress, week_ratings, class_vibes,
--   referrals, ...
-- This migration ONLY adds web-specific surfaces. It never alters existing
-- tables or columns. Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- weekly_challenges  (new — web feature, manually curated each Monday)
-- ----------------------------------------------------------------------------
create table if not exists public.weekly_challenges (
  id            serial primary key,
  week_start    date    not null,
  slug          text    not null,
  title         text    not null,
  description   text    not null default '',
  target_source text    not null,          -- matches user_xp_events.source
  target_count  integer not null,
  xp_reward     integer not null default 50,
  unique (week_start, slug)
);

create index if not exists weekly_challenges_week_idx
  on public.weekly_challenges (week_start);

-- ----------------------------------------------------------------------------
-- challenge_progress  (per-user progress, updated by trigger on user_xp_events)
-- ----------------------------------------------------------------------------
create table if not exists public.challenge_progress (
  user_id      uuid    not null references auth.users(id) on delete cascade,
  challenge_id integer not null references public.weekly_challenges(id) on delete cascade,
  progress     integer not null default 0,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

create or replace function public.on_xp_event_for_challenge()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
  -- compute the Monday of the week this event belongs to (UTC)
  evt_week date := date_trunc('week', (new.created_at at time zone 'utc'))::date;
begin
  for c in
    select * from public.weekly_challenges
    where week_start = evt_week and target_source = new.source
  loop
    insert into public.challenge_progress (user_id, challenge_id, progress)
    values (new.user_id, c.id, 1)
    on conflict (user_id, challenge_id) do update
      set progress = public.challenge_progress.progress + 1;

    update public.challenge_progress
       set completed_at = now()
     where user_id = new.user_id and challenge_id = c.id
       and completed_at is null and progress >= c.target_count;
  end loop;
  return new;
end $$;

drop trigger if exists xp_events_challenge_progress on public.user_xp_events;
create trigger xp_events_challenge_progress
  after insert on public.user_xp_events
  for each row execute function public.on_xp_event_for_challenge();

-- ----------------------------------------------------------------------------
-- leaderboard_weekly  (materialized view; refreshed by /api/cron/refresh-leaderboard)
-- ISO week derived from user_xp_events.created_at (Monday-anchored).
-- ----------------------------------------------------------------------------
drop materialized view if exists public.leaderboard_weekly;
create materialized view public.leaderboard_weekly as
with weekly as (
  select
    date_trunc('week', (created_at at time zone 'utc'))::date as week_start,
    user_id,
    sum(xp_awarded)::int as xp
  from public.user_xp_events
  group by 1, 2
)
select
  week_start,
  user_id,
  xp,
  rank() over (partition by week_start order by xp desc) as rank
from weekly;

create unique index leaderboard_weekly_pk
  on public.leaderboard_weekly (week_start, user_id);
create index leaderboard_weekly_week_rank_idx
  on public.leaderboard_weekly (week_start, rank);

create or replace function public.refresh_leaderboard_weekly()
returns void language sql security definer as $$
  refresh materialized view concurrently public.leaderboard_weekly;
$$;

-- one-shot initial populate so the view isn't empty before first cron tick
select public.refresh_leaderboard_weekly();

-- ----------------------------------------------------------------------------
-- activity_feed  (view — public surface, hides everything except display data)
-- Last 24h of XP events joined with profile basics. Respects discoverability.
-- ----------------------------------------------------------------------------
create or replace view public.activity_feed as
select
  e.id,
  e.user_id,
  e.source,
  e.xp_awarded as points,
  e.context,
  e.created_at,
  p.display_name,
  p.avatar_url
from public.user_xp_events e
join public.user_profiles  p on p.id = e.user_id
where e.created_at > now() - interval '24 hours'
  and coalesce(p.is_discoverable, true) = true
order by e.created_at desc
limit 200;

grant select on public.activity_feed       to anon, authenticated;
grant select on public.leaderboard_weekly  to anon, authenticated;
grant select on public.weekly_challenges   to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS on the new tables
-- ----------------------------------------------------------------------------
alter table public.weekly_challenges  enable row level security;
alter table public.challenge_progress enable row level security;

drop policy if exists "challenges read"   on public.weekly_challenges;
create policy "challenges read"   on public.weekly_challenges
  for select using (true);

drop policy if exists "progress read self" on public.challenge_progress;
create policy "progress read self" on public.challenge_progress
  for select using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Realtime — make user_xp_events flow to subscribers (idempotent)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_xp_events'
  ) then
    execute 'alter publication supabase_realtime add table public.user_xp_events';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Seed: this week's first challenges (idempotent on (week_start, slug))
-- ----------------------------------------------------------------------------
insert into public.weekly_challenges
  (week_start, slug, title, description, target_source, target_count, xp_reward)
values
  (date_trunc('week', now() at time zone 'utc')::date,
   'daily-dipper',
   'Daily Dipper',
   'Check in to Lagoon every day this week.',
   'daily_check_in', 5, 75),
  (date_trunc('week', now() at time zone 'utc')::date,
   'vibe-curator',
   'Vibe Curator',
   'Drop 3 class vibes this week.',
   'class_vibe', 3, 60),
  (date_trunc('week', now() at time zone 'utc')::date,
   'planner-grinder',
   'Planner Grinder',
   'Make 5 schedule moves this week.',
   'schedule_add', 5, 50)
on conflict (week_start, slug) do nothing;
