-- Academic streams (e.g. Science / Commerce / Arts) — a section-level
-- classification, most relevant at senior-secondary grades.
create table streams (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid        not null references schools(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index streams_school_id_idx on streams(school_id);

alter table streams enable row level security;

create policy "streams: school access"
  on streams for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table sections add column stream_id uuid references streams(id) on delete set null;
