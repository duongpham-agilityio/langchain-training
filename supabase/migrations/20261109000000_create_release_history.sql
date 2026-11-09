-- M-17: Release History table, one row per archived platform draft.
-- Columns mirror ReleaseHistoryRecordSchema (apps/web/src/types/release-history-record.ts).
-- Starts empty: no Turso data is migrated.

create table public.release_history (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  version        text not null check (length(version) > 0),
  title          text not null check (length(title) > 0),
  release_date   text not null check (release_date ~ '^\d{8}$'),
  title_override text,
  status         text not null default 'draft'
                 check (status in ('draft', 'published', 'archived')),
  github         text not null default '',
  app_store      text,
  google_play    text,
  platforms      jsonb not null default '[]'::jsonb check (jsonb_typeof(platforms) = 'array'),
  entries        jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array'),
  feat_count     integer not null default 0,
  fix_count      integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
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
