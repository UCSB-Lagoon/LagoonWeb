-- ============================================================================
-- UCSB Lagoon — Feedback inbox
--
-- Powers the public "Send feedback" widget and the /admin/feedback triage
-- queue. Mirrors how Linear / Raycast / Notion collect lightweight in-product
-- feedback: one table, status workflow, optional contact, source tagging.
--
-- Additive + idempotent.
-- ============================================================================

create table if not exists public.feedback (
  id            uuid primary key default gen_random_uuid(),
  kind          text        not null default 'idea',
                              -- idea | bug | praise | question | other
  message       text        not null,
  email         text,                    -- optional; for follow-up
  page_path     text,                    -- where it was submitted from
  user_id       uuid,                    -- set if a signed-in user submitted
  app_version   text,
  user_agent    text,
  ip            text,
  status        text        not null default 'new',
                              -- new | triaged | planned | shipped | declined
  pinned        boolean     not null default false,
  admin_notes   text,
  submitted_at  timestamptz not null default now(),
  triaged_at    timestamptz,
  constraint feedback_kind_check
    check (kind in ('idea','bug','praise','question','other')),
  constraint feedback_status_check
    check (status in ('new','triaged','planned','shipped','declined')),
  constraint feedback_message_len
    check (char_length(message) between 1 and 4000)
);

create index if not exists feedback_status_idx
  on public.feedback (status, submitted_at desc);
create index if not exists feedback_kind_idx
  on public.feedback (kind, submitted_at desc);
create index if not exists feedback_pinned_idx
  on public.feedback (pinned, submitted_at desc) where pinned = true;

-- RLS: anon INSERT only (public widget posts via anon key). Reads are
-- service-role only (admin dashboard), consistent with captain_applications.
alter table public.feedback enable row level security;
drop policy if exists "feedback_insert_anon" on public.feedback;
create policy "feedback_insert_anon"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- Stamp triaged_at when status first leaves "new".
create or replace function public.touch_feedback_triaged_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     and new.status <> 'new'
     and new.triaged_at is null then
    new.triaged_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists feedback_touch_triaged_at on public.feedback;
create trigger feedback_touch_triaged_at
  before update on public.feedback
  for each row execute function public.touch_feedback_triaged_at();

comment on table public.feedback is
  'Public product feedback (idea/bug/praise/question). Submitted via the floating widget, triaged in /admin/feedback.';
