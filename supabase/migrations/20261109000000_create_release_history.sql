-- F-06: release_history holds one release object per row; release_sends records each send.
-- Greenfield schema: no existing data is migrated.

create table public.release_history (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  status      text not null default 'draft'
              check (status in ('draft', 'published', 'archived')),
  release     jsonb not null default '{}'::jsonb
              check (jsonb_typeof(release) = 'object'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- List endpoint: newest first per owner, cursor on (created_at, id).
create index release_history_owner_created_idx
  on public.release_history (owner_id, created_at desc, id desc);

create function public.release_history_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger release_history_set_updated_at
  before update on public.release_history
  for each row execute function public.release_history_set_updated_at();

alter table public.release_history enable row level security;

create policy "release_history_select_own" on public.release_history
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "release_history_insert_own" on public.release_history
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "release_history_update_own" on public.release_history
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "release_history_delete_own" on public.release_history
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Each Slack or email send of a release, owned like release_history.
create table public.release_sends (
  id          uuid primary key default gen_random_uuid(),
  release_id  uuid not null references public.release_history (id) on delete cascade,
  owner_id    uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  channel     text not null check (channel in ('slack', 'email')),
  recipient   text not null default '',
  status      text not null check (status in ('pending', 'sent', 'failed')),
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz not null default now()
);

create index release_sends_owner_release_idx
  on public.release_sends (owner_id, release_id);

alter table public.release_sends enable row level security;

create policy "release_sends_select_own" on public.release_sends
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "release_sends_insert_own" on public.release_sends
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "release_sends_update_own" on public.release_sends
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "release_sends_delete_own" on public.release_sends
  for delete to authenticated
  using (owner_id = (select auth.uid()));
