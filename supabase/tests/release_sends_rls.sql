-- Manual RLS check for release_sends. Run after the migration (SQL editor or psql).
-- Raises an exception on failure; always rolls back, leaving no data behind.
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

insert into public.release_history (id, owner_id, release)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '{"version": "1.0.0"}'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '{"version": "2.0.0"}');

insert into public.release_sends (release_id, owner_id, channel, recipient, status)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'slack', '', 'sent'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'email', 'rls-b@example.test', 'pending');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

do $$
declare
  seen_b integer;
  seen_a integer;
  touched integer;
begin
  select count(*) into seen_b from public.release_sends
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  select count(*) into seen_a from public.release_sends;
  if seen_b <> 0 then raise exception 'FAIL: user A sees % of B sends', seen_b; end if;
  if seen_a <> 1 then raise exception 'FAIL: user A sees % sends, expected 1', seen_a; end if;

  update public.release_sends set status = 'failed'
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A updated B sends'; end if;

  delete from public.release_sends
    where owner_id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics touched = row_count;
  if touched <> 0 then raise exception 'FAIL: user A deleted B sends'; end if;

  begin
    insert into public.release_sends (release_id, owner_id, channel, status)
    values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'slack', 'sent');
    raise exception 'FAIL: user A inserted a send owned by B';
  exception when insufficient_privilege then
    null; -- expected: RLS with check rejects it
  end;
end $$;

rollback;
select 'release_sends RLS ok' as result;
