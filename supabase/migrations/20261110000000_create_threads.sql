-- M-23: one row per chat thread, owned by a user. The client makes the thread id, so it is text.
-- Written by the thread-title step (M-24); read by GET /api/memory/threads.
-- The checkpointer tables (M-22) hold the messages and have no owner, so this table is the ownership record.

create table public.threads (
  id         text primary key check (length(id) > 0),
  owner_id   uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  title      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- List endpoint: most recently updated first per owner.
create index threads_owner_updated_idx
  on public.threads (owner_id, updated_at desc, id desc);

alter table public.threads enable row level security;

create policy "threads_select_own" on public.threads
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "threads_insert_own" on public.threads
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "threads_update_own" on public.threads
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "threads_delete_own" on public.threads
  for delete to authenticated
  using (owner_id = (select auth.uid()));
