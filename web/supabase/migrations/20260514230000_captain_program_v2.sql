-- ============================================================================
-- UCSB Lagoon — Captain program v2
--
-- Adds:
--   1) Captain code + accept-email idempotency columns on captain_applications
--   2) referral_clicks table — logs every /r/[code] hit so the admin funnel
--      has a real top-of-funnel signal (separate from applications)
--
-- All additions are idempotent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Augment captain_applications
-- ----------------------------------------------------------------------------
alter table public.captain_applications
  add column if not exists captain_code            text,
  add column if not exists accepted_email_sent_at  timestamptz;

-- Captain codes must be unique when set (case-insensitive: /r/SUMMER and /r/summer
-- resolve to the same row in our route handler).
create unique index if not exists captain_applications_captain_code_uidx
  on public.captain_applications (lower(captain_code))
  where captain_code is not null;

comment on column public.captain_applications.captain_code is
  'Short, readable referral code (e.g. "BEACH7"). Assigned when status moves to "accepted". Used in /r/[code] links.';
comment on column public.captain_applications.accepted_email_sent_at is
  'Set the first time the acceptance email is sent. Prevents double-sends on repeated accept clicks.';

-- ----------------------------------------------------------------------------
-- 2) referral_clicks — every /r/[code] hit
-- ----------------------------------------------------------------------------
create table if not exists public.referral_clicks (
  id              uuid primary key default gen_random_uuid(),
  referral_code   text        not null,
  clicked_at      timestamptz not null default now(),
  user_agent      text,
  ip              text,
  is_bot          boolean     not null default false,
  country         text,
  page_path       text                    -- "/r/SUMMER7" etc.
);

create index if not exists referral_clicks_code_clicked_idx
  on public.referral_clicks (referral_code, clicked_at desc);

create index if not exists referral_clicks_clicked_idx
  on public.referral_clicks (clicked_at desc);

-- RLS — anon INSERT only, reads via service role (admin dashboard).
alter table public.referral_clicks enable row level security;
drop policy if exists "referral_clicks_insert_anon" on public.referral_clicks;
create policy "referral_clicks_insert_anon"
  on public.referral_clicks
  for insert
  to anon, authenticated
  with check (true);

comment on table public.referral_clicks is
  'Per-hit log of /r/[code] referral landings. Powers the funnel chart (clicks → applications → accepted) on /admin.';

-- ----------------------------------------------------------------------------
-- 3) Convenience view — daily funnel rollup
-- ----------------------------------------------------------------------------
-- Aggregates clicks + applications per UTC day. Used by the admin dashboard
-- to render the funnel chart without a hot subquery on every page load.
create or replace view public.captain_funnel_daily as
with click_days as (
  select date_trunc('day', clicked_at) as day,
         count(*)                     as clicks,
         count(distinct referral_code) as unique_codes
  from public.referral_clicks
  where is_bot = false
  group by 1
),
apply_days as (
  select date_trunc('day', submitted_at) as day,
         count(*) filter (where status <> 'withdrawn')                                  as applications,
         count(*) filter (where status in ('reviewing','accepted'))                     as reviewing_or_accepted,
         count(*) filter (where status = 'accepted')                                    as accepted
  from public.captain_applications
  group by 1
)
select coalesce(c.day, a.day)                  as day,
       coalesce(c.clicks, 0)                   as clicks,
       coalesce(c.unique_codes, 0)             as unique_codes,
       coalesce(a.applications, 0)             as applications,
       coalesce(a.reviewing_or_accepted, 0)    as reviewing_or_accepted,
       coalesce(a.accepted, 0)                 as accepted
from click_days c
full outer join apply_days a using (day)
order by day asc;

comment on view public.captain_funnel_daily is
  'Daily rollup of /r/ clicks vs. captain applications by status. Read by /admin dashboard.';
