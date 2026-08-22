-- Per-subject exam schedule (date/time/room) — the data an exam timetable
-- and admit card need, distinct from exam_results which only exists once
-- marks have actually been entered.
create table exam_schedules (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid        not null references schools(id) on delete cascade,
  exam_id    uuid        not null references exams(id) on delete cascade,
  subject_id uuid        not null references subjects(id) on delete cascade,
  exam_date  date        not null,
  start_time time        not null,
  end_time   time        not null,
  room       text,
  created_at timestamptz not null default now(),
  unique (exam_id, subject_id)
);

create index exam_schedules_exam_id_idx on exam_schedules(exam_id);

alter table exam_schedules enable row level security;

create policy "exam_schedules: school access"
  on exam_schedules for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
