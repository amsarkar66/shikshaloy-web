-- Explicit, exam-scoped grants of marks-entry rights, layered on top of the
-- default "assigned subject teacher" rule from section_subjects.teacher_id —
-- lets an admin authorize e.g. a substitute teacher to enter marks for one
-- exam without changing the standing subject assignment.
create table marks_entry_grants (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid        not null references schools(id) on delete cascade,
  exam_id            uuid        not null references exams(id) on delete cascade,
  section_subject_id uuid        not null references section_subjects(id) on delete cascade,
  staff_profile_id   uuid        not null references profiles(id) on delete cascade,
  created_at         timestamptz not null default now(),
  unique (exam_id, section_subject_id, staff_profile_id)
);

create index marks_entry_grants_exam_id_idx on marks_entry_grants(exam_id);

alter table marks_entry_grants enable row level security;

create policy "marks_entry_grants: school access"
  on marks_entry_grants for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
