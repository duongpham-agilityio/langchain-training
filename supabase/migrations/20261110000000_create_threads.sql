-- M-24: one row per chat thread that produced a reply, written with its generated title.
-- A turn blocked by a guard never inserts a row (the web stops polling after THREAD_ROW_GRACE_MS).
-- Columns mirror ThreadSummarySchema (apps/web/src/types/thread.ts).

create table if not exists public.threads (
  id         text primary key,
  owner_id   uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  title      text not null check (length(title) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists threads_owner_updated_idx
  on public.threads (owner_id, updated_at desc);

alter table public.threads enable row level security;

create policy "threads_select_own" on public.threads
  for select to authenticated
  using (owner_id = (select auth.uid()));
