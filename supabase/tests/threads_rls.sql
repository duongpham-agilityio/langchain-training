-- Manual RLS check for threads. Run after the migration (SQL editor or psql).
-- Raises an exception on failure; always rolls back, leaving no data behind.
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

insert into public.threads (id, owner_id, title)
values
  ('t-a', '00000000-0000-0000-0000-00000000000a', 'A thread'),
  ('t-b', '00000000-0000-0000-0000-00000000000b', 'B thread');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  seen_all integer;
  seen_b integer;
begin
  select count(*) into seen_all from public.threads;
  select count(*) into seen_b from public.threads where id = 't-b';
  if seen_b <> 0 then raise exception 'FAIL: user A sees B thread'; end if;
  if seen_all <> 1 then raise exception 'FAIL: user A sees % threads, expected 1', seen_all; end if;
end $$;

rollback;
