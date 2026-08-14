alter table public.students
  add column if not exists religion       text,
  add column if not exists caste          text,
  add column if not exists mother_tongue  text,
  add column if not exists language       text;

create table if not exists public.student_leave_requests (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid         not null references public.schools(id) on delete cascade,
  student_id  uuid         not null references public.students(id) on delete cascade,
  leave_type  leave_type   not null,
  from_date   date         not null,
  to_date     date         not null,
  days        integer      not null,
  reason      text,
  status      leave_status default 'pending',
  applied_on  date         default current_date,
  approved_by uuid         references public.staff_members(id) on delete set null,
  created_at  timestamptz  default now(),
  updated_at  timestamptz  default now()
);

create index if not exists student_leave_requests_student_id_idx on public.student_leave_requests(student_id);

alter table public.student_leave_requests enable row level security;

create policy "student_leave_requests: school access"
  on public.student_leave_requests for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
