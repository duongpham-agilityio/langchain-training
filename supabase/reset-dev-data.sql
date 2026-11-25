-- Dev reset: empties every table in schema "release-builder-dev" and keeps the structure.
-- IRREVERSIBLE. Covers chat threads, LangGraph checkpoints, user memory (store), projects,
-- saved releases, sends, scheduled sends and shared pages. Run it only on the dev database.
--
-- The *_migrations tables (checkpoint_migrations, store_migrations) are skipped on purpose:
-- they record which setup steps already ran, and emptying them makes `setup()` replay the
-- migrations at the next start.
--
-- Step 1: preview what will be emptied (run this first and check the database is the dev one).
select relname as table_name, n_live_tup as approx_rows
from pg_stat_user_tables
where schemaname = 'release-builder-dev'
  and relname not like '%\_migrations' escape '\'
order by relname;

-- Step 2: empty them. CASCADE also empties tables that reference these by foreign key.
do $$
declare
  stmt text;
begin
  select 'truncate table ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' restart identity cascade'
    into stmt
  from pg_tables
  where schemaname = 'release-builder-dev'
    and tablename not like '%\_migrations' escape '\';

  if stmt is not null then
    execute stmt;
  end if;
end $$;
