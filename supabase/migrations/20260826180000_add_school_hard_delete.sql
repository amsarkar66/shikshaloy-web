-- Super-admin "remove school" action for the schools list — deletes one
-- school out of the caller's own institution (not the whole institution;
-- see delete_institution_cascade for that). Same problem as that function:
-- schools.id has no cascade from several school-scoped tables (audit_log,
-- documents, report_generations, custom_reports, plus everything else that
-- function's list already covers), so children must be purged explicitly
-- before the schools row itself.
create or replace function delete_school_cascade(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from audit_log where school_id = p_school_id;
  delete from documents where school_id = p_school_id;
  delete from report_generations where school_id = p_school_id;
  delete from custom_reports where school_id = p_school_id;

  -- Front desk
  delete from postal_records where school_id = p_school_id;
  delete from gate_passes where school_id = p_school_id;
  delete from call_logs where school_id = p_school_id;
  delete from front_desk_enquiries where school_id = p_school_id;
  delete from visitor_logs where school_id = p_school_id;
  delete from certificate_requests where school_id = p_school_id;

  -- PTM / homework (children before parents)
  delete from ptm_bookings where session_id in (select id from ptm_sessions where school_id = p_school_id);
  delete from ptm_sessions where school_id = p_school_id;
  delete from homework_submissions where homework_id in (select id from homework where school_id = p_school_id);
  delete from homework where school_id = p_school_id;

  -- HR / admissions / exams / inventory / hostel / library / transport
  delete from payroll_records where school_id = p_school_id;
  delete from leave_requests where school_id = p_school_id;
  delete from admission_applications where school_id = p_school_id;
  delete from exam_schedules where school_id = p_school_id;
  delete from exam_results where school_id = p_school_id;
  delete from exams where school_id = p_school_id;
  delete from inventory_items where school_id = p_school_id;
  delete from hostel_allotments where school_id = p_school_id;
  delete from hostel_rooms where school_id = p_school_id;
  delete from book_issues where school_id = p_school_id;
  delete from library_books where school_id = p_school_id;
  delete from student_transport where school_id = p_school_id;
  delete from transport_routes where school_id = p_school_id;
  delete from vehicles where school_id = p_school_id;

  -- People (children before parents)
  delete from section_subjects where school_id = p_school_id;
  delete from staff_subjects where staff_id in (select id from staff_members where school_id = p_school_id);
  delete from student_parents where student_id in (select id from students where school_id = p_school_id);
  delete from parents where school_id = p_school_id;
  delete from students where school_id = p_school_id;
  delete from staff_members where school_id = p_school_id;
  delete from sections where school_id = p_school_id;
  delete from subjects where school_id = p_school_id;
  delete from grades where school_id = p_school_id;

  -- Attendance / fees
  delete from student_attendance where school_id = p_school_id;
  delete from staff_attendance where school_id = p_school_id;
  delete from transport_attendance where school_id = p_school_id;
  delete from fee_payments where school_id = p_school_id;

  -- Clear the dangling link, keep the account — same login may work at
  -- another school in this institution.
  update profiles set school_id = null where school_id = p_school_id;

  -- Cascades away student_documents/student_notes/student_academic_history,
  -- academic_years, attendance_methods, marks_entry_grants, and every other
  -- table that already had `on delete cascade` on school_id.
  delete from schools where id = p_school_id;
end;
$$;

revoke all on function delete_school_cascade(uuid) from public, anon, authenticated;
