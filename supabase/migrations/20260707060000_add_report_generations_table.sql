create table report_generations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  report_id integer not null,
  report_name text not null,
  category text not null,
  format text not null,
  generated_by text not null,
  size_kb integer not null,
  created_at timestamptz not null default now()
);

create index report_generations_school_idx on report_generations(school_id, created_at desc);
