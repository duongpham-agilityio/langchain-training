-- Manual RLS check for release_history. Run after the migration (SQL editor or psql).
-- Raises an exception on failure; always rolls back, leaving no data behind.
begin;

-- Schema: `release` is jsonb.
do $$
declare
  release_type text;
begin
  select data_type into release_type from information_schema.columns
    where table_schema = 'public' and table_name = 'release_history' and column_name = 'release';
  if release_type is distinct from 'jsonb' then
    raise exception 'FAIL: release_history.release is %, expected jsonb', release_type;
  end if;
end $$;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

insert into public.release_history (owner_id, release)
values
  ('00000000-0000-0000-0000-00000000000a', '{"version": "1.0.0", "title": "A release"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"version": "2.0.0", "title": "B release"}');

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

  update public.release_history set status = 'archived'
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A updated B rows'; end if;

  delete from public.release_history
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A deleted B rows'; end if;

  begin
    insert into public.release_history (owner_id, release)
    values ('00000000-0000-0000-0000-00000000000b', '{"version": "9"}');
    raise exception 'FAIL: user A inserted a row owned by B';
  exception when insufficient_privilege then
    null; -- expected: RLS with check rejects it
  end;
end $$;

rollback;
select 'release_history RLS ok' as result;
