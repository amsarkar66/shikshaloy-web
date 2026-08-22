-- Marks the institution used for the public live demo, so real platform
-- aggregates (kernel institutions list, platform analytics, revenue) can
-- exclude it.
alter table institutions add column if not exists is_demo boolean not null default false;
update institutions set is_demo = true where id = '7affe4c9-370f-4c01-a726-0744a346a912';

-- ============================================================
-- demo_baseline: frozen "known good" copies of the demo school's
-- structural data (people, classes, academics, facilities). The nightly
-- reset job wipes the corresponding public rows for the demo school and
-- restores them from here, so kernel edits to the baseline (re-run this
-- snapshot after editing the live demo school as super_admin) become the
-- new nightly state. Time-sensitive tables (attendance, fee_payments) are
-- NOT snapshotted here — they're generated fresh relative to today on
-- every reset instead. Exam/homework/leave/PTM dates are snapshotted but
-- shifted by a rolling offset at restore time so they stay positioned
-- the same distance from "today" as they were when this was captured.
create schema if not exists demo_baseline;

drop table if exists demo_baseline.grades;
create table demo_baseline.grades as
  select * from public.grades where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.subjects;
create table demo_baseline.subjects as
  select * from public.subjects where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.sections;
create table demo_baseline.sections as
  select * from public.sections
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.section_subjects;
create table demo_baseline.section_subjects as
  select * from public.section_subjects
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.staff_members;
create table demo_baseline.staff_members as
  select * from public.staff_members where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.staff_subjects;
create table demo_baseline.staff_subjects as
  select ss.* from public.staff_subjects ss
  join public.staff_members sm on sm.id = ss.staff_id
  where sm.school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.students;
create table demo_baseline.students as
  select * from public.students
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.parents;
create table demo_baseline.parents as
  select * from public.parents where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.student_parents;
create table demo_baseline.student_parents as
  select sp.* from public.student_parents sp
  join demo_baseline.students s on s.id = sp.student_id;

drop table if exists demo_baseline.vehicles;
create table demo_baseline.vehicles as
  select * from public.vehicles where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.transport_routes;
create table demo_baseline.transport_routes as
  select * from public.transport_routes where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.student_transport;
create table demo_baseline.student_transport as
  select * from public.student_transport
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.library_books;
create table demo_baseline.library_books as
  select * from public.library_books where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.book_issues;
create table demo_baseline.book_issues as
  select * from public.book_issues where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.hostel_rooms;
create table demo_baseline.hostel_rooms as
  select * from public.hostel_rooms where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.hostel_allotments;
create table demo_baseline.hostel_allotments as
  select * from public.hostel_allotments where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.inventory_items;
create table demo_baseline.inventory_items as
  select * from public.inventory_items where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.exams;
create table demo_baseline.exams as
  select * from public.exams
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.exam_results;
create table demo_baseline.exam_results as
  select er.* from public.exam_results er
  join demo_baseline.exams e on e.id = er.exam_id;

drop table if exists demo_baseline.exam_schedules;
create table demo_baseline.exam_schedules as
  select es.* from public.exam_schedules es
  join demo_baseline.exams e on e.id = es.exam_id;

drop table if exists demo_baseline.admission_applications;
create table demo_baseline.admission_applications as
  select * from public.admission_applications
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.leave_requests;
create table demo_baseline.leave_requests as
  select * from public.leave_requests where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.payroll_records;
create table demo_baseline.payroll_records as
  select * from public.payroll_records where school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.homework;
create table demo_baseline.homework as
  select * from public.homework
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.homework_submissions;
create table demo_baseline.homework_submissions as
  select hs.* from public.homework_submissions hs
  join demo_baseline.homework h on h.id = hs.homework_id;

drop table if exists demo_baseline.ptm_sessions;
create table demo_baseline.ptm_sessions as
  select * from public.ptm_sessions
  where school_id = '00000000-0000-0000-0000-000000000001'
    and academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.ptm_bookings;
create table demo_baseline.ptm_bookings as
  select pb.* from public.ptm_bookings pb
  join demo_baseline.ptm_sessions p on p.id = pb.session_id;

drop table if exists demo_baseline.certificate_requests;
create table demo_baseline.certificate_requests as
  select * from public.certificate_requests where school_id = '00000000-0000-0000-0000-000000000001';
