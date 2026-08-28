-- ============================================================
-- Subject-wise (period) attendance — separate from the daily
-- student_attendance/staff_attendance system. One session per
-- (timetable_slot, date); conducted=false records a period that
-- was scheduled but not taught (teacher absent, cancelled, etc.)
-- without any per-student rows attached.
-- ============================================================

create table subject_attendance_sessions (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid        not null references schools(id) on delete cascade,
  timetable_slot_id uuid        not null references timetable_slots(id) on delete cascade,
  section_id        uuid        not null references sections(id) on delete cascade,
  subject_id        uuid        not null references subjects(id) on delete cascade,
  teacher_id        uuid        references profiles(id) on delete set null,
  date              date        not null,
  period_number     integer     not null,
  conducted         boolean     not null default true,
  remarks           text,
  taken_by          uuid        references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (timetable_slot_id, date)
);

create table subject_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  session_id  uuid        not null references subject_attendance_sessions(id) on delete cascade,
  student_id  uuid        not null references students(id) on delete cascade,
  status      text        not null check (status in ('present', 'absent')),
  created_at  timestamptz not null default now(),
  unique (session_id, student_id)
);

create index subject_attendance_sessions_section_date_idx on subject_attendance_sessions(section_id, date);
create index subject_attendance_sessions_teacher_date_idx  on subject_attendance_sessions(teacher_id, date);
create index subject_attendance_student_id_idx on subject_attendance(student_id);

alter table subject_attendance_sessions enable row level security;
alter table subject_attendance          enable row level security;

create policy "subject_attendance_sessions: school access"
  on subject_attendance_sessions for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "subject_attendance: school access"
  on subject_attendance for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
