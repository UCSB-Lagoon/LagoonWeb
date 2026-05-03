-- ============================================================================
-- UCSB Lagoon — public aggregate views for /stats
-- All views expose ONLY aggregates, never per-user rows.
-- Safe to grant to anon. None of these read auth.users directly.
-- ============================================================================

-- XP by source (all-time)
create or replace view public.stats_xp_by_source as
select
  source,
  count(*)::int       as event_count,
  sum(xp_awarded)::int as total_xp,
  round(avg(xp_awarded)::numeric, 2) as avg_xp
from public.user_xp_events
group by source
order by total_xp desc;

-- Daily totals for the last 30 days
create or replace view public.stats_xp_daily as
select
  (created_at at time zone 'America/Los_Angeles')::date as day,
  count(*)::int        as event_count,
  count(distinct user_id)::int as active_users,
  sum(xp_awarded)::int as total_xp
from public.user_xp_events
where created_at > now() - interval '30 days'
group by 1
order by 1;

-- Major breakdown (counts, not names)
create or replace view public.stats_majors as
select
  coalesce(nullif(major_code, ''), 'Undeclared') as major_code,
  count(*)::int as users
from public.user_profiles
group by 1
order by users desc;

-- Class-level distribution
create or replace view public.stats_class_levels as
select
  coalesce(nullif(class_level, ''), 'Unknown') as class_level,
  count(*)::int as users
from public.user_profiles
group by 1
order by users desc;

-- Badge rarity — earned counts vs catalog counts
create or replace view public.stats_badges_by_rarity as
with earned as (
  select bc.rarity, count(*)::int as earned
  from public.user_badges ub
  join public.badge_catalog bc on bc.badge_id = ub.badge_id
  group by bc.rarity
),
catalog as (
  select rarity, count(*)::int as available
  from public.badge_catalog
  group by rarity
)
select
  c.rarity,
  c.available,
  coalesce(e.earned, 0) as earned
from catalog c
left join earned e using (rarity)
order by case c.rarity
  when 'common'    then 1
  when 'rare'      then 2
  when 'epic'      then 3
  when 'legendary' then 4
  else 99 end;

-- Top earned badges (catalog title + count)
create or replace view public.stats_top_badges as
select
  bc.badge_id,
  bc.title,
  bc.icon,
  bc.rarity,
  count(ub.user_id)::int as earned_count
from public.badge_catalog bc
left join public.user_badges ub on ub.badge_id = bc.badge_id
group by bc.badge_id, bc.title, bc.icon, bc.rarity
order by earned_count desc, bc.title;

-- Election turnout — distinct voters + total votes
create or replace view public.stats_election_turnout as
select
  (select count(distinct user_id) from public.election_pulse_votes)::int as distinct_voters,
  (select count(*) from public.election_pulse_votes)::int                 as total_votes,
  (select count(*) from public.election_pulse_race_totals)::int           as race_count;

-- Aggregate snapshot — single-row view used by the hero strip
create or replace view public.stats_overview as
select
  (select count(*) from public.user_profiles)::int               as total_users,
  (select count(*) from public.user_gamification_profiles
     where last_active_at > now() - interval '14 days')::int     as active_users_14d,
  (select coalesce(sum(xp_awarded),0) from public.user_xp_events)::int as lifetime_xp,
  (select count(*) from public.user_xp_events)::int              as lifetime_events,
  (select count(*) from public.user_badges)::int                 as badges_earned,
  (select max(streak_days) from public.user_gamification_profiles)::int as top_streak,
  (select count(*) from public.friendships)::int                 as friendships,
  (select count(*) from public.class_vibes)::int                 as class_vibes,
  (select count(*) from public.election_pulse_votes)::int        as election_votes;

grant select on
  public.stats_xp_by_source,
  public.stats_xp_daily,
  public.stats_majors,
  public.stats_class_levels,
  public.stats_badges_by_rarity,
  public.stats_top_badges,
  public.stats_election_turnout,
  public.stats_overview
to anon, authenticated;
