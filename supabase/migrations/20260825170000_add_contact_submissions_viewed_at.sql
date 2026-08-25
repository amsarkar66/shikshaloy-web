alter table public.contact_submissions
  add column if not exists viewed_at timestamptz;
