-- ============================================================================
-- Growth aggregates for /stats.
--
-- Same rules as 0002: aggregates only, granted to anon, and security_invoker
-- left OFF so the view owner reads the base tables. If invoker were on, RLS
-- would shrink a public page to whatever the anon role can see row-by-row,
-- and the headline counts (which already bypass RLS) would stop matching
-- the charts.
-- ============================================================================

create or replace view public.stats_signups_daily as
select
  (created_at at time zone 'America/Los_Angeles')::date as day,
  count(*)::int as signups
from public.user_profiles
where created_at is not null
  and created_at > now() - interval '40 days'
group by 1
order by 1;

create or replace view public.stats_class_vibe_totals as
select
  course_key,
  count(*)::int as vibes,
  round(avg(
    case lower(rating)
      when 'great' then 5
      when 'good'  then 4
      when 'okay'  then 3
      when 'meh'   then 2
      when 'bad'   then 1
      else 3
    end
  )::numeric, 2) as avg_score
from public.class_vibes
group by course_key;

alter view public.stats_signups_daily     set (security_invoker = false);
alter view public.stats_class_vibe_totals set (security_invoker = false);

-- Hold the existing public aggregates to the same rule. A later default of
-- security_invoker = on must not silently drop them to the caller's RLS.
alter view public.stats_overview          set (security_invoker = false);
alter view public.stats_xp_by_source      set (security_invoker = false);
alter view public.stats_xp_daily          set (security_invoker = false);
alter view public.stats_majors            set (security_invoker = false);
alter view public.stats_class_levels      set (security_invoker = false);
alter view public.stats_badges_by_rarity  set (security_invoker = false);
alter view public.stats_top_badges        set (security_invoker = false);
alter view public.stats_election_turnout  set (security_invoker = false);

grant select on
  public.stats_signups_daily,
  public.stats_class_vibe_totals
to anon, authenticated;
