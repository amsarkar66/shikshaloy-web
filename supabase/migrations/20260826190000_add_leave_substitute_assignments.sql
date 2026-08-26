-- Real substitute-teacher assignments for an approved staff leave, replacing
-- the client-side-only mock plan the Leaves page used to fabricate (fake
-- teacher names, a hashed fake "affected timetable" that never touched the
-- real schedule, and a plan that vanished on refresh since nothing backed it).
create table leave_substitute_assignments (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid not null references schools(id) on delete cascade,
  leave_request_id     uuid not null references leave_requests(id) on delete cascade,
  timetable_slot_id    uuid not null references timetable_slots(id) on delete cascade,
  occurrence_date      date not null,
  substitute_staff_id  uuid references staff_members(id) on delete set null,
  created_at           timestamptz not null default now(),
  unique (leave_request_id, timetable_slot_id, occurrence_date)
);

create index leave_substitute_assignments_leave_idx on leave_substitute_assignments(leave_request_id);

alter table leave_substitute_assignments enable row level security;
-- No policies — only ever touched via supabaseAdmin (service role), same as
-- every other admin-only table in this schema.
