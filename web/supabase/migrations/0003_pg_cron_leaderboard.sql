-- Hourly refresh of the materialized weekly leaderboard via Supabase pg_cron.
-- Vercel Hobby caps cron jobs at one execution per day, so we run the schedule
-- inside Postgres instead — no external trigger or plan upgrade required.

create extension if not exists pg_cron with schema extensions;

-- Drop any prior schedule with the same name so this migration is idempotent.
do $$
begin
  perform cron.unschedule('refresh_leaderboard_weekly_hourly');
exception when others then
  null; -- no-op if it didn't exist yet
end $$;

-- Run on the top of every hour, UTC.
select cron.schedule(
  'refresh_leaderboard_weekly_hourly',
  '0 * * * *',
  $cron$ select public.refresh_leaderboard_weekly(); $cron$
);
