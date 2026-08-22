-- ============================================================
-- Close RLS coverage gaps
--
-- The initial schema (20260628000000_initial_schema.sql) enabled RLS and
-- shipped policies on every table it created. Every table added since then
-- has picked up RLS too — except these thirteen, which shipped without an
-- `enable row level security` line and therefore have NO tenant isolation
-- at the database level: any request using a non-service-role Supabase key
-- can read/write across every school.
--
-- This migration brings them in line with the rest of the schema, reusing
-- the same auth_role() / auth_school_id() helpers defined in the initial
-- schema. Billing (school_subscriptions, subscription_invoices) is scoped
-- by institution_id since 20260811000000_add_institutions_hierarchy.sql
-- moved billing from per-school to per-institution, and is treated as
-- read-only for tenants — every write in the app goes through the service
-- role (Razorpay webhook, billing actions), so restricting client-writable
-- access to kernel only tightens nothing the app actually relies on.
-- ============================================================

-- homework / homework_submissions
alter table homework enable row level security;

create policy "homework: school access"
  on homework for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table homework_submissions enable row level security;

create policy "homework_submissions: school access"
  on homework_submissions for all
  using (
    exists (
      select 1 from homework h
      where h.id = homework_submissions.homework_id
        and (h.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

-- documents (circulars, policies, forms, notices)
alter table documents enable row level security;

create policy "documents: school access"
  on documents for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- settings
alter table school_academic_settings enable row level security;

create policy "school_academic_settings: school access"
  on school_academic_settings for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table role_templates enable row level security;

create policy "role_templates: school access"
  on role_templates for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table notification_preferences enable row level security;

create policy "notification_preferences: own row"
  on notification_preferences for all
  using (profile_id = auth.uid() or auth_role() = 'kernel');

-- reports
alter table report_generations enable row level security;

create policy "report_generations: school access"
  on report_generations for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table custom_reports enable row level security;

create policy "custom_reports: school access"
  on custom_reports for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- PTM
alter table ptm_sessions enable row level security;

create policy "ptm_sessions: school access"
  on ptm_sessions for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

alter table ptm_bookings enable row level security;

create policy "ptm_bookings: school access"
  on ptm_bookings for all
  using (
    exists (
      select 1 from ptm_sessions s
      where s.id = ptm_bookings.session_id
        and (s.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

-- audit log — accountability trail, so read access follows the same
-- admin/super_admin/kernel gate as the audit-log nav item itself, not
-- plain school membership.
alter table audit_log enable row level security;

create policy "audit_log: admin access"
  on audit_log for all
  using (
    (school_id = auth_school_id() and auth_role() in ('admin', 'super_admin'))
    or auth_role() = 'kernel'
  );

-- billing — institution-scoped, read-only for tenants; every write goes
-- through the service role (Razorpay webhook, billing server actions).
alter table school_subscriptions enable row level security;

create policy "school_subscriptions: institution read"
  on school_subscriptions for select
  using (
    institution_id in (select id from institutions where owner_id = auth.uid())
    or institution_id = (select institution_id from schools where id = auth_school_id())
    or auth_role() = 'kernel'
  );

create policy "school_subscriptions: kernel insert"
  on school_subscriptions for insert
  with check (auth_role() = 'kernel');

create policy "school_subscriptions: kernel update"
  on school_subscriptions for update
  using (auth_role() = 'kernel')
  with check (auth_role() = 'kernel');

create policy "school_subscriptions: kernel delete"
  on school_subscriptions for delete
  using (auth_role() = 'kernel');

alter table subscription_invoices enable row level security;

create policy "subscription_invoices: institution read"
  on subscription_invoices for select
  using (
    institution_id in (select id from institutions where owner_id = auth.uid())
    or institution_id = (select institution_id from schools where id = auth_school_id())
    or auth_role() = 'kernel'
  );

create policy "subscription_invoices: kernel insert"
  on subscription_invoices for insert
  with check (auth_role() = 'kernel');

create policy "subscription_invoices: kernel update"
  on subscription_invoices for update
  using (auth_role() = 'kernel')
  with check (auth_role() = 'kernel');

create policy "subscription_invoices: kernel delete"
  on subscription_invoices for delete
  using (auth_role() = 'kernel');
