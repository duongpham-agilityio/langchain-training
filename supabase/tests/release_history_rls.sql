-- Manual RLS check for release_history. Run after the migration (SQL editor or psql).
-- Raises an exception on failure; always rolls back, leaving no data behind.
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

insert into public.release_history (owner_id, version, title, release_date)
values
  ('00000000-0000-0000-0000-00000000000a', '1.0.0', 'A release', '20261109'),
  ('00000000-0000-0000-0000-00000000000b', '2.0.0', 'B release', '20261109');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  seen_b integer;
  seen_a integer;
  touched integer;
begin
  select count(*) into seen_b from public.release_history
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  select count(*) into seen_a from public.release_history;
  if seen_b <> 0 then raise exception 'FAIL: user A sees % of B rows', seen_b; end if;
  if seen_a <> 1 then raise exception 'FAIL: user A sees % rows, expected 1', seen_a; end if;

  update public.release_history set title = 'hijack'
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A updated B rows'; end if;

  delete from public.release_history
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A deleted B rows'; end if;

  begin
    insert into public.release_history (owner_id, version, title, release_date)
    values ('00000000-0000-0000-0000-00000000000b', '9', 'spoof', '20261109');
    raise exception 'FAIL: user A inserted a row owned by B';
  exception when insufficient_privilege then
    null; -- expected: RLS with check rejects it
  end;
end $$;

rollback;
select 'release_history RLS ok' as result;
