alter table public.contact_submissions
  add column if not exists flagged boolean not null default false;
