-- F-21: scheduled_sends holds one scheduled Slack send per row.
-- run_at is an absolute instant; time_zone (IANA name) is only for showing the time back to the user.

create table public.scheduled_sends (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  release_id  uuid not null references public.release_history (id) on delete cascade,
  content     text not null,
  run_at      timestamptz not null,
  time_zone   text not null check (length(time_zone) > 0),
  status      text not null default 'pending'
              check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts    integer not null default 0 check (attempts >= 0),
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Poller: due pending jobs, oldest first.
create index scheduled_sends_due_idx
  on public.scheduled_sends (run_at)
  where status = 'pending';

-- Release detail: the sends of one release.
create index scheduled_sends_owner_release_idx
  on public.scheduled_sends (owner_id, release_id);

create function public.scheduled_sends_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scheduled_sends_set_updated_at
  before update on public.scheduled_sends
  for each row execute function public.scheduled_sends_set_updated_at();

alter table public.scheduled_sends enable row level security;

create policy "scheduled_sends_select_own" on public.scheduled_sends
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "scheduled_sends_insert_own" on public.scheduled_sends
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "scheduled_sends_update_own" on public.scheduled_sends
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "scheduled_sends_delete_own" on public.scheduled_sends
  for delete to authenticated
  using (owner_id = (select auth.uid()));
