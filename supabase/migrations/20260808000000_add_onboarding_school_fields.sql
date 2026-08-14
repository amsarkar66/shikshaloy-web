alter table public.schools
  add column if not exists short_name text,
  add column if not exists grades_from text,
  add column if not exists grades_to text,
  add column if not exists pin_code text,
  add column if not exists principal_phone text,
  add column if not exists principal_designation text;
