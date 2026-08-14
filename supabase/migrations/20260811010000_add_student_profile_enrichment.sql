-- Emergency contact + basic medical info directly on the student row.
alter table public.students
  add column if not exists emergency_contact_name     text,
  add column if not exists emergency_contact_phone     text,
  add column if not exists emergency_contact_relation  text,
  add column if not exists medical_conditions          text,
  add column if not exists allergies                   text;

-- Student document vault (birth certificate, TC, ID proof, etc.) — distinct
-- from the school-wide `documents` table (circulars/policies) and from
-- `admission_documents` (which is tied to the application, not the
-- enrolled student, and stops being reachable once the student is enrolled).
create table if not exists public.student_documents (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid        not null references public.schools(id) on delete cascade,
  student_id    uuid        not null references public.students(id) on delete cascade,
  category      text        not null default 'other',
  file_name     text        not null,
  file_url      text        not null,
  uploaded_by   uuid        references public.profiles(id) on delete set null,
  uploaded_at   timestamptz not null default now()
);

create index if not exists student_documents_student_id_idx on public.student_documents(student_id);

alter table public.student_documents enable row level security;

create policy "student_documents: school access"
  on public.student_documents for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', true, 5242880, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "student-documents: public read"
  on storage.objects for select
  using (bucket_id = 'student-documents');

-- Free-text staff notes/remarks about a student (behavioral, academic,
-- achievement, general) — a private log, not shown to parents/students.
create table if not exists public.student_notes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references public.schools(id) on delete cascade,
  student_id  uuid        not null references public.students(id) on delete cascade,
  author_id   uuid        references public.profiles(id) on delete set null,
  category    text        not null default 'general',
  note        text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists student_notes_student_id_idx on public.student_notes(student_id);

alter table public.student_notes enable row level security;

create policy "student_notes: school access"
  on public.student_notes for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- Cross-year academic history — one row per year a student has been on
-- roll, recorded at enrollment and at each promotion/retention/graduation
-- decision, so a student's class trail survives section/year mutation.
create table if not exists public.student_academic_history (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid        not null references public.schools(id) on delete cascade,
  student_id        uuid        not null references public.students(id) on delete cascade,
  academic_year_id  uuid        not null references public.academic_years(id) on delete cascade,
  section_id        uuid        references public.sections(id) on delete set null,
  roll_no           text,
  outcome           text        not null default 'enrolled', -- enrolled | promoted | retained | graduated
  recorded_at       timestamptz not null default now()
);

create index if not exists student_academic_history_student_id_idx on public.student_academic_history(student_id);

alter table public.student_academic_history enable row level security;

create policy "student_academic_history: school access"
  on public.student_academic_history for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
