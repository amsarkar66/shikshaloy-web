alter table public.schools
  add column if not exists tagline text,
  add column if not exists email text,
  add column if not exists board text;
