create or replace function reset_demo_school()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id  uuid := '00000000-0000-0000-0000-000000000001';
  v_ay_id      uuid := '00000000-0000-0000-0000-000000000002';
  -- Baseline was captured on 2026-08-21. Every exam/homework/leave/PTM date
  -- shifts by the same rolling offset, so the whole frozen timeline stays
  -- positioned exactly as far from "today" as it was when captured.
  v_offset     interval := (current_date - date '2026-08-21');
  v_student    record;
  v_staff      record;
  v_transport  record;
  v_day        date;
  v_seed       int;
  v_status     text;
  v_month_offset int;
  v_month      text;
  v_month_date date;
  v_mod        int;
begin
  -------------------------------------------------------------------
  -- 1. Delete existing demo-school rows (children before parents)
  -------------------------------------------------------------------
  delete from certificate_requests where school_id = v_school_id;
  delete from ptm_bookings where session_id in (select id from ptm_sessions where school_id = v_school_id);
  delete from ptm_sessions where school_id = v_school_id;
  delete from homework_submissions where homework_id in (select id from homework where school_id = v_school_id);
  delete from homework where school_id = v_school_id;
  delete from payroll_records where school_id = v_school_id;
  delete from leave_requests where school_id = v_school_id;
  delete from admission_applications where school_id = v_school_id;
  delete from exam_schedules where school_id = v_school_id;
  delete from exam_results where school_id = v_school_id;
  delete from exams where school_id = v_school_id;
  delete from inventory_items where school_id = v_school_id;
  delete from hostel_allotments where school_id = v_school_id;
  delete from hostel_rooms where school_id = v_school_id;
  delete from book_issues where school_id = v_school_id;
  delete from library_books where school_id = v_school_id;
  delete from student_transport where school_id = v_school_id;
  delete from transport_routes where school_id = v_school_id;
  delete from vehicles where school_id = v_school_id;
  delete from section_subjects where school_id = v_school_id;
  delete from staff_subjects where staff_id in (select id from staff_members where school_id = v_school_id);
  delete from student_parents where student_id in (select id from students where school_id = v_school_id);
  delete from parents where school_id = v_school_id;
  delete from students where school_id = v_school_id;
  delete from staff_members where school_id = v_school_id;
  delete from sections where school_id = v_school_id;
  delete from subjects where school_id = v_school_id;
  delete from grades where school_id = v_school_id;
  delete from student_attendance where school_id = v_school_id;
  delete from staff_attendance where school_id = v_school_id;
  delete from transport_attendance where school_id = v_school_id;
  delete from fee_payments where school_id = v_school_id;

  -------------------------------------------------------------------
  -- 2. Restore structural baseline (parents before children)
  -------------------------------------------------------------------
  insert into grades select * from demo_baseline.grades;
  insert into subjects select * from demo_baseline.subjects;
  insert into sections select * from demo_baseline.sections;
  insert into staff_members select * from demo_baseline.staff_members;
  insert into students select * from demo_baseline.students;
  insert into parents select * from demo_baseline.parents;
  insert into student_parents select * from demo_baseline.student_parents;
  insert into staff_subjects select * from demo_baseline.staff_subjects;
  insert into section_subjects select * from demo_baseline.section_subjects;
  insert into vehicles select * from demo_baseline.vehicles;
  insert into transport_routes select * from demo_baseline.transport_routes;
  insert into student_transport select * from demo_baseline.student_transport;
  insert into library_books select * from demo_baseline.library_books;
  insert into book_issues select * from demo_baseline.book_issues;
  insert into hostel_rooms select * from demo_baseline.hostel_rooms;
  insert into hostel_allotments select * from demo_baseline.hostel_allotments;
  insert into inventory_items select * from demo_baseline.inventory_items;

  insert into exams (id, school_id, academic_year_id, name, type, status, start_date, end_date, created_at)
    select id, school_id, academic_year_id, name, type, status, start_date + v_offset, end_date + v_offset, created_at
    from demo_baseline.exams;
  insert into exam_results select * from demo_baseline.exam_results;
  insert into exam_schedules (id, school_id, exam_id, subject_id, exam_date, start_time, end_time, room, created_at)
    select id, school_id, exam_id, subject_id, exam_date + v_offset, start_time, end_time, room, created_at
    from demo_baseline.exam_schedules;

  insert into admission_applications (
    id, school_id, academic_year_id, application_no, applicant_name, dob, gender, applying_for_grade,
    parent_name, parent_phone, parent_email, previous_school, submitted_date, status, notes, reviewed_by, created_at, updated_at
  )
    select id, school_id, academic_year_id, application_no, applicant_name, dob, gender, applying_for_grade,
           parent_name, parent_phone, parent_email, previous_school, submitted_date + v_offset, status, notes, reviewed_by, created_at, updated_at
    from demo_baseline.admission_applications;

  insert into leave_requests (id, school_id, staff_id, leave_type, from_date, to_date, days, reason, status, applied_on, approved_by, created_at, updated_at)
    select id, school_id, staff_id, leave_type, from_date + v_offset, to_date + v_offset, days, reason, status, applied_on + v_offset, approved_by, created_at, updated_at
    from demo_baseline.leave_requests;

  insert into payroll_records select * from demo_baseline.payroll_records;

  insert into homework (id, school_id, academic_year_id, title, subject_id, section_id, teacher_id, assigned_date, due_date, description, status, created_at)
    select id, school_id, academic_year_id, title, subject_id, section_id, teacher_id, assigned_date + v_offset, due_date + v_offset, description, status, created_at
    from demo_baseline.homework;
  insert into homework_submissions (id, homework_id, student_id, submitted_at)
    select id, homework_id, student_id, submitted_at + v_offset
    from demo_baseline.homework_submissions;

  insert into ptm_sessions (id, school_id, academic_year_id, section_id, teacher_id, date, start_time, end_time, slot_minutes, total_slots, status, created_at)
    select id, school_id, academic_year_id, section_id, teacher_id, date + v_offset, start_time, end_time, slot_minutes, total_slots, status, created_at
    from demo_baseline.ptm_sessions;
  insert into ptm_bookings select * from demo_baseline.ptm_bookings;

  insert into certificate_requests (id, school_id, student_id, cert_type, purpose, requested_on, issued_on, status, issued_by, created_at, updated_at)
    select id, school_id, student_id, cert_type, purpose, requested_on + v_offset,
           case when issued_on is null then null else issued_on + v_offset end,
           status, issued_by, created_at, updated_at
    from demo_baseline.certificate_requests;

  -------------------------------------------------------------------
  -- 3. Generate fresh time-sensitive activity (relative to today)
  -------------------------------------------------------------------

  -- Student attendance: last 15 calendar days, Mon-Sat, ~85% present / 10% late / 5% absent
  for v_student in select id from students where school_id = v_school_id and academic_year_id = v_ay_id loop
    for v_day in select generate_series(current_date - 14, current_date, '1 day')::date loop
      if extract(dow from v_day) <> 0 then
        v_seed := ('x' || substr(md5(v_student.id::text || v_day::text), 1, 8))::bit(32)::int;
        v_mod := abs(v_seed) % 20;
        v_status := case when v_mod < 17 then 'present' when v_mod < 19 then 'late' else 'absent' end;
        insert into student_attendance (school_id, student_id, section_id, date, status)
          select v_school_id, v_student.id, s.section_id, v_day, v_status::attendance_status
          from students s where s.id = v_student.id;
      end if;
    end loop;
  end loop;

  -- Staff attendance: same window, mostly present with rare leave
  for v_staff in select id from staff_members where school_id = v_school_id loop
    for v_day in select generate_series(current_date - 14, current_date, '1 day')::date loop
      if extract(dow from v_day) <> 0 then
        v_seed := ('x' || substr(md5(v_staff.id::text || v_day::text), 1, 8))::bit(32)::int;
        v_mod := abs(v_seed) % 25;
        v_status := case when v_mod < 21 then 'present' when v_mod < 23 then 'late' when v_mod = 23 then 'on_leave' else 'absent' end;
        insert into staff_attendance (school_id, staff_id, date, status)
          values (v_school_id, v_staff.id, v_day, v_status::staff_attendance_status);
      end if;
    end loop;
  end loop;

  -- Transport attendance: last 10 weekdays, morning + evening, mostly present
  for v_transport in select student_id, route_id, academic_year_id from student_transport where school_id = v_school_id loop
    for v_day in select generate_series(current_date - 9, current_date, '1 day')::date loop
      if extract(dow from v_day) <> 0 then
        v_seed := ('x' || substr(md5(v_transport.student_id::text || v_day::text || 'm'), 1, 8))::bit(32)::int;
        v_status := case when abs(v_seed) % 15 < 13 then 'present' else 'absent' end;
        insert into transport_attendance (school_id, student_id, route_id, academic_year_id, date, trip, status)
          values (v_school_id, v_transport.student_id, v_transport.route_id, v_transport.academic_year_id, v_day, 'morning', v_status::attendance_status);

        v_seed := ('x' || substr(md5(v_transport.student_id::text || v_day::text || 'e'), 1, 8))::bit(32)::int;
        v_status := case when abs(v_seed) % 15 < 13 then 'present' else 'absent' end;
        insert into transport_attendance (school_id, student_id, route_id, academic_year_id, date, trip, status)
          values (v_school_id, v_transport.student_id, v_transport.route_id, v_transport.academic_year_id, v_day, 'evening', v_status::attendance_status);
      end if;
    end loop;
  end loop;

  -- Fee payments: current month + prior 2 months, Tuition Fee, mostly paid
  for v_student in select id from students where school_id = v_school_id and academic_year_id = v_ay_id loop
    for v_month_offset in 0..2 loop
      v_month_date := date_trunc('month', current_date) - (v_month_offset || ' months')::interval;
      v_month := to_char(v_month_date, 'YYYY-MM');
      v_seed := ('x' || substr(md5(v_student.id::text || v_month), 1, 8))::bit(32)::int;
      v_mod := abs(v_seed) % 10;

      if v_month_offset = 0 then
        -- current month: dues are freshest, more likely still open
        if v_mod < 4 then
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status, paid_date, payment_mode)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 5000, 'paid', current_date - (v_mod || ' days')::interval, 'online');
        elsif v_mod < 7 then
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 2500, 'partial');
        else
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 0, 'overdue');
        end if;
      else
        if v_mod < 8 then
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status, paid_date, payment_mode)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 5000, 'paid', v_month_date + 5, 'online');
        elsif v_mod < 9 then
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status, paid_date, payment_mode)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 3000, 'partial', v_month_date + 10, 'online');
        else
          insert into fee_payments (school_id, student_id, academic_year_id, month_str, category, amount_due, amount_paid, status)
            values (v_school_id, v_student.id, v_ay_id, v_month, 'Tuition Fee', 5000, 0, 'overdue');
        end if;
      end if;
    end loop;
  end loop;

  -------------------------------------------------------------------
  -- 4. Refresh denormalized summary columns
  -------------------------------------------------------------------
  update students s set attendance_pct = coalesce(a.pct, 0)
  from (
    select student_id,
           round(100.0 * count(*) filter (where status in ('present','late')) / greatest(count(*), 1), 2) as pct
    from student_attendance where school_id = v_school_id group by student_id
  ) a
  where a.student_id = s.id and s.school_id = v_school_id;

  update students s set fee_status = f.status::fee_status
  from (
    select distinct on (student_id) student_id, status
    from fee_payments where school_id = v_school_id
    order by student_id, month_str desc
  ) f
  where f.student_id = s.id and s.school_id = v_school_id;

  update sections sec set avg_attendance = coalesce(a.pct, 0)
  from (
    select section_id, round(avg(attendance_pct), 2) as pct
    from students where school_id = v_school_id and academic_year_id = v_ay_id
    group by section_id
  ) a
  where a.section_id = sec.id and sec.school_id = v_school_id;
end;
$$;
