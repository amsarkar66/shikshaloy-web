create type homework_status as enum ('active', 'closed');

create table homework (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  academic_year_id uuid not null references academic_years(id),
  title text not null,
  subject_id uuid not null references subjects(id),
  section_id uuid not null references sections(id),
  teacher_id uuid not null references staff_members(id),
  assigned_date date not null,
  due_date date not null,
  description text,
  status homework_status not null default 'active',
  created_at timestamptz not null default now()
);

create table homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  student_id uuid not null references students(id),
  submitted_at timestamptz not null default now(),
  unique (homework_id, student_id)
);

create index homework_section_idx on homework(section_id);
create index homework_submissions_homework_idx on homework_submissions(homework_id);
