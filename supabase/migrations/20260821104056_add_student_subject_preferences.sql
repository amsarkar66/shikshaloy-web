-- Per-student elective subject choices (subjects.type = 'elective'), so
-- Gradebook, Admit Cards, and other exam-facing views only show the specific
-- subjects a student opted into rather than every elective offered to their
-- section.
create table student_subject_preferences (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid        not null references schools(id) on delete cascade,
  student_id         uuid        not null references students(id) on delete cascade,
  section_subject_id uuid        not null references section_subjects(id) on delete cascade,
  academic_year_id   uuid        not null references academic_years(id) on delete cascade,
  created_at         timestamptz not null default now(),
  unique (student_id, section_subject_id)
);

create index student_subject_preferences_student_id_idx on student_subject_preferences(student_id);

alter table student_subject_preferences enable row level security;

create policy "student_subject_preferences: school access"
  on student_subject_preferences for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
