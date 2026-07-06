create type doc_category as enum ('Circular', 'Policy', 'Form', 'Notice');
create type doc_audience as enum ('All', 'Staff', 'Parents', 'Students');
create type doc_file_kind as enum ('pdf', 'doc', 'xlsx', 'image');

create table documents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  title text not null,
  category doc_category not null,
  audience doc_audience not null,
  file_kind doc_file_kind not null,
  size_kb integer not null,
  uploaded_by text not null,
  uploaded_date date not null,
  created_at timestamptz not null default now()
);
