-- Kernel-only "delete institution" action (irreversible, gated behind an
-- email OTP in the app layer — see app/dashboard/institutions/actions.ts).
--
-- This table holds the short-lived OTP; service-role only, no client policy.
create table institution_deletion_otps (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references institutions(id) on delete cascade,
  requested_by    uuid not null references profiles(id) on delete cascade,
  code_hash       text not null,
  expires_at      timestamptz not null,
  attempts        int not null default 0,
  created_at      timestamptz not null default now()
);

create index institution_deletion_otps_institution_idx on institution_deletion_otps(institution_id);

alter table institution_deletion_otps enable row level security;
-- No policies — only ever touched via supabaseAdmin (service role).

-- Permanently deletes an institution and every row scoped to its schools.
--
-- `schools.institution_id` is `on delete set null` and several school-scoped
-- tables (audit_log, documents, report_generations, custom_reports, plus
-- everything reset_demo_school() below mirrors) reference schools(id) with
-- no cascade at all — so a bare `delete from institutions` would either
-- silently orphan the schools or fail outright on the first blocked FK.
-- This function purges children before parents explicitly, in the same
-- order already proven by reset_demo_school() for a single school, extended
-- to the handful of tables that function doesn't touch.
--
-- People (staff/students/parents/drivers) keep their login — the same
-- account may be part-time at another institution — only the now-dangling
-- link to a deleted school is cleared. The owner's account is untouched too
-- (deleting the institution just leaves it without one).
create or replace function delete_institution_cascade(p_institution_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_ids uuid[];
begin
  select coalesce(array_agg(id), '{}') into v_school_ids from schools where institution_id = p_institution_id;

  -- Institution-level billing — references institutions directly, no cascade.
  delete from subscription_invoices where institution_id = p_institution_id;
  delete from school_subscriptions where institution_id = p_institution_id;

  if array_length(v_school_ids, 1) > 0 then
    -- No cascade path from schools at all.
    delete from audit_log where school_id = any(v_school_ids);
    delete from documents where school_id = any(v_school_ids);
    delete from report_generations where school_id = any(v_school_ids);
    delete from custom_reports where school_id = any(v_school_ids);

    -- Front desk
    delete from postal_records where school_id = any(v_school_ids);
    delete from gate_passes where school_id = any(v_school_ids);
    delete from call_logs where school_id = any(v_school_ids);
    delete from front_desk_enquiries where school_id = any(v_school_ids);
    delete from visitor_logs where school_id = any(v_school_ids);
    delete from certificate_requests where school_id = any(v_school_ids);

    -- PTM / homework (children before parents)
    delete from ptm_bookings where session_id in (select id from ptm_sessions where school_id = any(v_school_ids));
    delete from ptm_sessions where school_id = any(v_school_ids);
    delete from homework_submissions where homework_id in (select id from homework where school_id = any(v_school_ids));
    delete from homework where school_id = any(v_school_ids);

    -- HR / admissions / exams / inventory / hostel / library / transport
    delete from payroll_records where school_id = any(v_school_ids);
    delete from leave_requests where school_id = any(v_school_ids);
    delete from admission_applications where school_id = any(v_school_ids);
    delete from exam_schedules where school_id = any(v_school_ids);
    delete from exam_results where school_id = any(v_school_ids);
    delete from exams where school_id = any(v_school_ids);
    delete from inventory_items where school_id = any(v_school_ids);
    delete from hostel_allotments where school_id = any(v_school_ids);
    delete from hostel_rooms where school_id = any(v_school_ids);
    delete from book_issues where school_id = any(v_school_ids);
    delete from library_books where school_id = any(v_school_ids);
    delete from student_transport where school_id = any(v_school_ids);
    delete from transport_routes where school_id = any(v_school_ids);
    delete from vehicles where school_id = any(v_school_ids);

    -- People (children before parents)
    delete from section_subjects where school_id = any(v_school_ids);
    delete from staff_subjects where staff_id in (select id from staff_members where school_id = any(v_school_ids));
    delete from student_parents where student_id in (select id from students where school_id = any(v_school_ids));
    delete from parents where school_id = any(v_school_ids);
    delete from students where school_id = any(v_school_ids);
    delete from staff_members where school_id = any(v_school_ids);
    delete from sections where school_id = any(v_school_ids);
    delete from subjects where school_id = any(v_school_ids);
    delete from grades where school_id = any(v_school_ids);

    -- Attendance / fees
    delete from student_attendance where school_id = any(v_school_ids);
    delete from staff_attendance where school_id = any(v_school_ids);
    delete from transport_attendance where school_id = any(v_school_ids);
    delete from fee_payments where school_id = any(v_school_ids);

    -- Clear the dangling link, keep the account.
    update profiles set school_id = null where school_id = any(v_school_ids);

    -- Cascades away student_documents/student_notes/student_academic_history,
    -- academic_years, attendance_methods, marks_entry_grants, and every
    -- other table that already had `on delete cascade` on school_id.
    delete from schools where id = any(v_school_ids);
  end if;

  -- support_requests cascades automatically (on delete cascade on
  -- institution_id); the owner's login is untouched.
  delete from institutions where id = p_institution_id;
end;
$$;

revoke all on function delete_institution_cascade(uuid) from public, anon, authenticated;
