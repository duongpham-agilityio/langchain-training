-- Releases no longer have a version, so the parsed version parts must not block inserts.
-- `major`, `minor` and `patch` were NOT NULL columns that exist only in some databases (not in
-- the earlier migrations); `drop ... if exists` makes this safe on every database.

alter table public.release_history
  drop column if exists major,
  drop column if exists minor,
  drop column if exists patch;
