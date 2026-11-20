-- IP-02a: every chat and every stored release belongs to exactly one project.
-- Greenfield: no backfill and no default project. Old rows are cleaned by hand before this runs
-- (adding a NOT NULL column without a default fails on a table that still has rows).

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid()
              references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Project list: newest first per owner.
create index projects_owner_created_idx
  on public.projects (owner_id, created_at desc, id desc);

create function public.projects_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.projects_set_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "projects_update_own" on public.projects
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- release_history belongs to one project. No default: an insert without project_id is rejected.
alter table public.release_history
  add column project_id uuid not null
  references public.projects (id) on delete cascade;

create index release_history_owner_project_idx
  on public.release_history (owner_id, project_id, created_at desc, id desc);
