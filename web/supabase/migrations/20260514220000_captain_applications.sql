-- ============================================================================
-- UCSB Lagoon — Captain program application table
--
-- Stores submissions from the /captains landing page. Receiving endpoint is
-- POST /api/captains (web/app/api/captains/route.ts) which does a best-effort
-- insert and logs everything as a fallback.
--
-- This migration is additive and safe to re-run.
-- ============================================================================

create table if not exists public.captain_applications (
  id              uuid primary key default gen_random_uuid(),
  name            text        not null,
  email           text        not null,
  year            text,
  major           text,
  instagram       text,
  pitch           text        not null,
  why             text,
  referral_code   text,                          -- value of `lagoon_ref` cookie when submitted
  user_agent      text,
  ip              text,
  status          text        not null default 'new',
                                                  -- new | reviewing | accepted | rejected | withdrawn
  reviewer_notes  text,
  submitted_at    timestamptz not null default now(),
  reviewed_at     timestamptz,
  constraint captain_applications_email_check
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint captain_applications_status_check
    check (status in ('new','reviewing','accepted','rejected','withdrawn'))
);

-- One application per email — re-applications update existing row through admin UI.
create unique index if not exists captain_applications_email_uidx
  on public.captain_applications (lower(email));

create index if not exists captain_applications_status_idx
  on public.captain_applications (status, submitted_at desc);

create index if not exists captain_applications_referral_idx
  on public.captain_applications (referral_code)
  where referral_code is not null;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.captain_applications enable row level security;

-- The /api/captains route writes via the anon key, so allow INSERT for anon.
-- Reads are admin-only — handled outside Supabase JS for now (service-role
-- queries from a future /admin dashboard).
drop policy if exists "captain_applications_insert_anon"
  on public.captain_applications;
create policy "captain_applications_insert_anon"
  on public.captain_applications
  for insert
  to anon, authenticated
  with check (true);

-- Explicit deny on select for non-service-role roles (defense in depth — RLS
-- defaults to deny, this is just documentation).
drop policy if exists "captain_applications_select_none"
  on public.captain_applications;
-- (Intentionally no select policy; only service_role bypasses RLS.)

-- ----------------------------------------------------------------------------
-- Trigger: stamp reviewed_at when status changes off "new"
-- ----------------------------------------------------------------------------
create or replace function public.touch_captain_application_reviewed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and new.status <> 'new'
     and new.reviewed_at is null then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists captain_applications_touch_reviewed_at on public.captain_applications;
create trigger captain_applications_touch_reviewed_at
  before update on public.captain_applications
  for each row
  execute function public.touch_captain_application_reviewed_at();

comment on table public.captain_applications is
  'UCSB campus captain (ambassador) program applications. Submitted via /captains form.';
comment on column public.captain_applications.referral_code is
  'Value of the lagoon_ref cookie at submission — credits the captain who drove the apply click.';
