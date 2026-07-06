create type ptm_status as enum ('scheduled', 'completed', 'cancelled');
create type ptm_booking_status as enum ('booked', 'attended', 'no_show');

create table ptm_sessions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  academic_year_id uuid not null references academic_years(id),
  section_id uuid not null references sections(id),
  teacher_id uuid not null references staff_members(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  slot_minutes integer not null default 10,
  total_slots integer not null,
  status ptm_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table ptm_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ptm_sessions(id) on delete cascade,
  student_id uuid not null references students(id),
  parent_id uuid not null references parents(id),
  slot_time time not null,
  status ptm_booking_status not null default 'booked'
);

create index ptm_sessions_section_idx on ptm_sessions(section_id);
create index ptm_bookings_session_idx on ptm_bookings(session_id);
