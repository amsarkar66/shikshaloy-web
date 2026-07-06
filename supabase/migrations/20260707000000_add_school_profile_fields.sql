alter table public.schools
  add column if not exists principal_name text,
  add column if not exists principal_email text,
  add column if not exists established_year integer;
