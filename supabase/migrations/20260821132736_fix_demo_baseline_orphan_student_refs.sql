-- A prior "promote students" test run moved a few students to a second,
-- stray academic year on the demo school without updating rows that still
-- reference them by student_id. Re-snapshot the affected demo_baseline
-- tables joined through demo_baseline.students (the current-academic-year
-- roster) so they never reference a student outside that roster.
drop table if exists demo_baseline.student_transport;
create table demo_baseline.student_transport as
  select st.* from public.student_transport st
  join demo_baseline.students s on s.id = st.student_id
  where st.school_id = '00000000-0000-0000-0000-000000000001'
    and st.academic_year_id = '00000000-0000-0000-0000-000000000002';

drop table if exists demo_baseline.hostel_allotments;
create table demo_baseline.hostel_allotments as
  select ha.* from public.hostel_allotments ha
  join demo_baseline.students s on s.id = ha.student_id
  where ha.school_id = '00000000-0000-0000-0000-000000000001';

drop table if exists demo_baseline.exam_results;
create table demo_baseline.exam_results as
  select er.* from public.exam_results er
  join demo_baseline.exams e on e.id = er.exam_id
  join demo_baseline.students s on s.id = er.student_id;

drop table if exists demo_baseline.homework_submissions;
create table demo_baseline.homework_submissions as
  select hs.* from public.homework_submissions hs
  join demo_baseline.homework h on h.id = hs.homework_id
  join demo_baseline.students s on s.id = hs.student_id;

drop table if exists demo_baseline.ptm_bookings;
create table demo_baseline.ptm_bookings as
  select pb.* from public.ptm_bookings pb
  join demo_baseline.ptm_sessions p on p.id = pb.session_id
  join demo_baseline.students s on s.id = pb.student_id
  join demo_baseline.parents pa on pa.id = pb.parent_id;

drop table if exists demo_baseline.certificate_requests;
create table demo_baseline.certificate_requests as
  select cr.* from public.certificate_requests cr
  join demo_baseline.students s on s.id = cr.student_id
  where cr.school_id = '00000000-0000-0000-0000-000000000001';
