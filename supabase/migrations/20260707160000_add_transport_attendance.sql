create type attendance_trip as enum ('morning', 'evening');

create table transport_attendance (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid              not null references schools(id) on delete cascade,
  student_id       uuid              not null references students(id) on delete cascade,
  route_id         uuid              not null references transport_routes(id) on delete cascade,
  academic_year_id uuid              not null references academic_years(id) on delete cascade,
  date             date              not null,
  trip             attendance_trip   not null,
  status           attendance_status not null default 'present',
  marked_by        uuid              references profiles(id) on delete set null,
  remarks          text,
  created_at       timestamptz       default now(),
  unique (student_id, date, trip)
);

create index on transport_attendance (school_id, route_id, date);

alter table transport_attendance enable row level security;

create policy "transport_attendance: school access"
  on transport_attendance for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
