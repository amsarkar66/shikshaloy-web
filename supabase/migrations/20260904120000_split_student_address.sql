-- Splits the single free-text "address" into present/permanent address for
-- students and admission applications. The old `address` columns are left
-- in place (unused going forward, same treatment as parents.address) —
-- backfilled here so existing records aren't blank in either new field.

alter table students
  add column if not exists present_address text,
  add column if not exists permanent_address text;

update students
  set present_address = coalesce(present_address, address),
      permanent_address = coalesce(permanent_address, address)
  where address is not null;

alter table admission_applications
  add column if not exists present_address text,
  add column if not exists permanent_address text;

update admission_applications
  set present_address = coalesce(present_address, address),
      permanent_address = coalesce(permanent_address, address)
  where address is not null;
