-- Front Desk demo data: the public demo school had no visitor log, walk-in
-- enquiries, call log, gate passes, or postal register entries, so the
-- Front Desk page looked empty for demo visitors. This seeds it once now,
-- and folds front-desk activity into reset_demo_school() so it's
-- regenerated fresh (relative to "today", like attendance/fee_payments)
-- on every nightly reset instead of going stale or disappearing.

-- ============================================================
-- 1. One-time seed for the currently-live demo school
-- ============================================================
do $$
declare
  v_school_id  uuid := '00000000-0000-0000-0000-000000000001';
  v_ay_id      uuid := '00000000-0000-0000-0000-000000000002';
  v_staff_user uuid := '57b6758f-84cc-4123-9a54-45e61f6def43'; -- staff@shikshaloy.com
begin
  insert into visitor_logs (school_id, visitor_name, phone, purpose, meeting_with, in_time, out_time, created_by)
  select v_school_id, v.name, v.phone, v.purpose, sm.full_name, now() - v.ago,
         case when v.ago > interval '20 minutes' then now() - v.ago + interval '35 minutes' else null end,
         v_staff_user
  from (values
    ('Rohit Malhotra', '9876543210', 'Parent-teacher discussion', interval '2 hours'),
    ('Sunita Verma', '9823456781', 'Fee enquiry', interval '5 hours'),
    ('Ramesh Iyer', '9812345670', 'Admission enquiry', interval '1 day 3 hours'),
    ('Priya Nair', '9845123456', 'Vendor meeting', interval '2 days 1 hour'),
    ('Vikram Rao', '9856234567', 'Dropping off books', interval '15 minutes'),
    ('Anjali Deshmukh', '9867345678', 'Job interview', interval '3 days 4 hours')
  ) as v(name, phone, purpose, ago)
  join lateral (
    select full_name from staff_members where school_id = v_school_id order by random() limit 1
  ) sm on true;

  insert into front_desk_enquiries (school_id, name, phone, email, interested_grade, source, notes, status, created_by, created_at) values
    (v_school_id, 'Neha Kulkarni', '9871234567', 'neha.k@example.com', 'Grade 3', 'Walk-in', 'Interested in transport facility', 'new', v_staff_user, now() - interval '1 day'),
    (v_school_id, 'Sanjay Bhatia', '9882345678', 'sanjay.b@example.com', 'Grade 6', 'Referral', 'Referred by an existing parent', 'contacted', v_staff_user, now() - interval '3 days'),
    (v_school_id, 'Farida Sheikh', '9893456789', 'farida.s@example.com', 'Nursery', 'Website', 'Asked about fee structure', 'converted', v_staff_user, now() - interval '6 days'),
    (v_school_id, 'Arun Kumar', '9904567890', 'arun.k@example.com', 'Grade 9', 'Walk-in', 'Wants a campus tour', 'contacted', v_staff_user, now() - interval '8 days'),
    (v_school_id, 'Meenal Joshi', '9915678901', 'meenal.j@example.com', 'Grade 1', 'Phone', 'Follow up next week', 'new', v_staff_user, now() - interval '10 days'),
    (v_school_id, 'Tariq Ahmed', '9926789012', 'tariq.a@example.com', 'Grade 5', 'Website', 'Not interested currently', 'closed', v_staff_user, now() - interval '12 days');

  insert into call_logs (school_id, caller_name, phone, direction, purpose, notes, handled_by, created_at) values
    (v_school_id, 'Sneha Kapoor', '9937890123', 'incoming', 'Fee due date query', 'Informed due date is the 10th', v_staff_user, now() - interval '3 hours'),
    (v_school_id, 'Ajay Mehta', '9948901234', 'incoming', 'Leave application for child', 'Noted, forwarded to class teacher', v_staff_user, now() - interval '6 hours'),
    (v_school_id, 'Transport vendor', '9959012345', 'outgoing', 'Bus route confirmation', 'Confirmed pickup point change', v_staff_user, now() - interval '1 day 2 hours'),
    (v_school_id, 'Pooja Rathi', '9960123456', 'incoming', 'Admission enquiry follow-up', null, v_staff_user, now() - interval '1 day 5 hours'),
    (v_school_id, 'Book supplier', '9971234567', 'outgoing', 'Library book order', 'Placed order for 20 titles', v_staff_user, now() - interval '2 days'),
    (v_school_id, 'Harish Chandra', '9982345678', 'incoming', 'Complaint about bus timing', 'Escalated to transport in-charge', v_staff_user, now() - interval '2 days 4 hours'),
    (v_school_id, 'Kiran Bedi', '9993456789', 'incoming', 'PTM schedule query', 'Shared upcoming PTM date', v_staff_user, now() - interval '3 days'),
    (v_school_id, 'Print shop', '9004567890', 'outgoing', 'Certificate printing', null, v_staff_user, now() - interval '4 days');

  insert into gate_passes (school_id, student_id, reason, pickup_person_name, pickup_person_relation, pass_time, approved_by)
  select v_school_id, st.id, g.reason, g.pickup_name, g.relation, now() - g.ago, v_staff_user
  from (values
    ('Feeling unwell, sent home early', 'Sunita Sharma', 'Mother', interval '4 hours'),
    ('Dental appointment', 'Rajesh Singh', 'Father', interval '1 day 3 hours'),
    ('Family function', 'Kavya Reddy', 'Sister', interval '2 days 2 hours'),
    ('Early pickup - sports practice', 'Suresh Nair', 'Father', interval '1 hour')
  ) as g(reason, pickup_name, relation, ago)
  join lateral (
    select id from students where school_id = v_school_id and academic_year_id = v_ay_id order by random() limit 1
  ) st on true;

  insert into postal_records (school_id, direction, reference_no, subject, contact_name, record_date, notes, created_by) values
    (v_school_id, 'receive', 'CBSE/2026/1123', 'Circular on board exam schedule', 'CBSE Regional Office', current_date, null, v_staff_user),
    (v_school_id, 'dispatch', 'SPS/OUT/0456', 'Transfer certificate for withdrawn student', 'Delhi Public School', current_date - 1, 'Sent via registered post', v_staff_user),
    (v_school_id, 'receive', 'GOVT/EDU/2288', 'Government scholarship scheme notice', 'District Education Office', current_date - 2, null, v_staff_user),
    (v_school_id, 'dispatch', 'SPS/OUT/0455', 'Fee reminder letters', 'Parent Association', current_date - 3, 'Bulk dispatch - 12 letters', v_staff_user),
    (v_school_id, 'receive', 'BANK/STMT/990', 'Monthly bank statement', 'State Bank of India', current_date - 4, null, v_staff_user),
    (v_school_id, 'dispatch', 'SPS/OUT/0454', 'Invitation for annual day', 'Local Municipal Office', current_date - 5, null, v_staff_user);
end $$;

-- ============================================================
-- 2. Fold front-desk regeneration into the nightly reset function
-- ============================================================
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
  delete from postal_records where school_id = v_school_id;
  delete from gate_passes where school_id = v_school_id;
  delete from call_logs where school_id = v_school_id;
  delete from front_desk_enquiries where school_id = v_school_id;
  delete from visitor_logs where school_id = v_school_id;
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

  -- Front desk: visitor log, walk-in enquiries, call log, gate passes, and
  -- postal register — regenerated fresh each reset (not baseline data),
  -- so the front desk page never looks empty for demo visitors.
  insert into visitor_logs (school_id, visitor_name, phone, purpose, meeting_with, in_time, out_time)
  select v_school_id, v.name, v.phone, v.purpose, sm.full_name, now() - v.ago,
         case when v.ago > interval '20 minutes' then now() - v.ago + interval '35 minutes' else null end
  from (values
    ('Rohit Malhotra', '9876543210', 'Parent-teacher discussion', interval '2 hours'),
    ('Sunita Verma', '9823456781', 'Fee enquiry', interval '5 hours'),
    ('Ramesh Iyer', '9812345670', 'Admission enquiry', interval '1 day 3 hours'),
    ('Priya Nair', '9845123456', 'Vendor meeting', interval '2 days 1 hour'),
    ('Vikram Rao', '9856234567', 'Dropping off books', interval '15 minutes'),
    ('Anjali Deshmukh', '9867345678', 'Job interview', interval '3 days 4 hours')
  ) as v(name, phone, purpose, ago)
  join lateral (
    select full_name from staff_members where school_id = v_school_id order by random() limit 1
  ) sm on true;

  insert into front_desk_enquiries (school_id, name, phone, email, interested_grade, source, notes, status, created_at) values
    (v_school_id, 'Neha Kulkarni', '9871234567', 'neha.k@example.com', 'Grade 3', 'Walk-in', 'Interested in transport facility', 'new', now() - interval '1 day'),
    (v_school_id, 'Sanjay Bhatia', '9882345678', 'sanjay.b@example.com', 'Grade 6', 'Referral', 'Referred by an existing parent', 'contacted', now() - interval '3 days'),
    (v_school_id, 'Farida Sheikh', '9893456789', 'farida.s@example.com', 'Nursery', 'Website', 'Asked about fee structure', 'converted', now() - interval '6 days'),
    (v_school_id, 'Arun Kumar', '9904567890', 'arun.k@example.com', 'Grade 9', 'Walk-in', 'Wants a campus tour', 'contacted', now() - interval '8 days'),
    (v_school_id, 'Meenal Joshi', '9915678901', 'meenal.j@example.com', 'Grade 1', 'Phone', 'Follow up next week', 'new', now() - interval '10 days'),
    (v_school_id, 'Tariq Ahmed', '9926789012', 'tariq.a@example.com', 'Grade 5', 'Website', 'Not interested currently', 'closed', now() - interval '12 days');

  insert into call_logs (school_id, caller_name, phone, direction, purpose, notes, created_at) values
    (v_school_id, 'Sneha Kapoor', '9937890123', 'incoming', 'Fee due date query', 'Informed due date is the 10th', now() - interval '3 hours'),
    (v_school_id, 'Ajay Mehta', '9948901234', 'incoming', 'Leave application for child', 'Noted, forwarded to class teacher', now() - interval '6 hours'),
    (v_school_id, 'Transport vendor', '9959012345', 'outgoing', 'Bus route confirmation', 'Confirmed pickup point change', now() - interval '1 day 2 hours'),
    (v_school_id, 'Pooja Rathi', '9960123456', 'incoming', 'Admission enquiry follow-up', null, now() - interval '1 day 5 hours'),
    (v_school_id, 'Book supplier', '9971234567', 'outgoing', 'Library book order', 'Placed order for 20 titles', now() - interval '2 days'),
    (v_school_id, 'Harish Chandra', '9982345678', 'incoming', 'Complaint about bus timing', 'Escalated to transport in-charge', now() - interval '2 days 4 hours'),
    (v_school_id, 'Kiran Bedi', '9993456789', 'incoming', 'PTM schedule query', 'Shared upcoming PTM date', now() - interval '3 days'),
    (v_school_id, 'Print shop', '9004567890', 'outgoing', 'Certificate printing', null, now() - interval '4 days');

  insert into gate_passes (school_id, student_id, reason, pickup_person_name, pickup_person_relation, pass_time)
  select v_school_id, st.id, g.reason, g.pickup_name, g.relation, now() - g.ago
  from (values
    ('Feeling unwell, sent home early', 'Sunita Sharma', 'Mother', interval '4 hours'),
    ('Dental appointment', 'Rajesh Singh', 'Father', interval '1 day 3 hours'),
    ('Family function', 'Kavya Reddy', 'Sister', interval '2 days 2 hours'),
    ('Early pickup - sports practice', 'Suresh Nair', 'Father', interval '1 hour')
  ) as g(reason, pickup_name, relation, ago)
  join lateral (
    select id from students where school_id = v_school_id and academic_year_id = v_ay_id order by random() limit 1
  ) st on true;

  insert into postal_records (school_id, direction, reference_no, subject, contact_name, record_date, notes) values
    (v_school_id, 'receive', 'CBSE/2026/1123', 'Circular on board exam schedule', 'CBSE Regional Office', current_date, null),
    (v_school_id, 'dispatch', 'SPS/OUT/0456', 'Transfer certificate for withdrawn student', 'Delhi Public School', current_date - 1, 'Sent via registered post'),
    (v_school_id, 'receive', 'GOVT/EDU/2288', 'Government scholarship scheme notice', 'District Education Office', current_date - 2, null),
    (v_school_id, 'dispatch', 'SPS/OUT/0455', 'Fee reminder letters', 'Parent Association', current_date - 3, 'Bulk dispatch - 12 letters'),
    (v_school_id, 'receive', 'BANK/STMT/990', 'Monthly bank statement', 'State Bank of India', current_date - 4, null),
    (v_school_id, 'dispatch', 'SPS/OUT/0454', 'Invitation for annual day', 'Local Municipal Office', current_date - 5, null);

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
