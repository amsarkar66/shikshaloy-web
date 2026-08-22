-- Per-school configurable grading scale (e.g. A+ from 90%, A from 80%, ...),
-- replacing what used to be a hardcoded cutoff table in application code.
create table grade_bands (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid         not null references schools(id) on delete cascade,
  label       text         not null,
  min_percent numeric(5,2) not null check (min_percent >= 0 and min_percent <= 100),
  created_at  timestamptz  not null default now(),
  unique (school_id, label)
);

create index grade_bands_school_id_idx on grade_bands(school_id);

alter table grade_bands enable row level security;

create policy "grade_bands: school access"
  on grade_bands for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
