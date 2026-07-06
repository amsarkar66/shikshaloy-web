create type audit_action as enum ('create', 'update', 'delete', 'approve', 'reject', 'login');

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  actor_name text not null,
  actor_role text not null,
  action audit_action not null,
  module text not null,
  description text not null,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_log_school_idx on audit_log(school_id, created_at desc);
