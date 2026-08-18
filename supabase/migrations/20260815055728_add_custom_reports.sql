create table custom_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  name text not null,
  description text,
  entity text not null,
  columns jsonb not null default '[]'::jsonb,
  filters jsonb not null default '[]'::jsonb,
  group_by text,
  aggregate jsonb,
  sort_by text,
  sort_dir text,
  is_scheduled boolean not null default false,
  schedule_label text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index custom_reports_school_idx on custom_reports(school_id, created_at desc);

alter table report_generations alter column report_id drop not null;
alter table report_generations add column custom_report_id uuid references custom_reports(id) on delete cascade;
create index report_generations_custom_idx on report_generations(custom_report_id);
