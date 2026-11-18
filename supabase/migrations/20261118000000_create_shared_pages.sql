-- shared_pages holds one public changelog page (a self-contained HTML document) per row.
-- The server reads and writes it through its own pool, so RLS is on and there is no policy:
-- the anon and authenticated roles cannot touch the table.

create table public.shared_pages (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  html        text not null,
  created_at  timestamptz not null default now()
);

alter table public.shared_pages enable row level security;
