-- invitePrincipal (app/dashboard/principals/actions.ts) has always created a
-- new admin account as just an auth.users row + profiles row — it never
-- inserted a matching staff_members row. Every principal account created
-- through that flow (i.e. every real admin in production before
-- promoteExistingToAdmin shipped, commit 0c71654) therefore has
-- profiles.role = 'admin' but no staff_members row at all.
--
-- This matters for the role/identity model migration
-- (docs/architecture/role-and-identity-model.md, Phase 2): moving
-- authorization checks from profiles.role to staff_members would silently
-- lock out every one of those existing admins the moment it shipped. This
-- backfill closes that gap first — one staff_members row per admin profile
-- that doesn't already have one — so Phase 2 has something consistent to
-- migrate onto.
--
-- email/full_name come from auth.users / profiles rather than
-- schools.principal_email — that column reflects only the *current* invite
-- per school and isn't reliable if a school has had more than one admin
-- profile over time, whereas auth.users.email is authoritative per-account.
insert into staff_members (
  school_id, profile_id, full_name, email, type, designation,
  joined_date, status, permission_template_id, permission_template_name
)
select
  p.school_id,
  p.id,
  coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1), 'Admin'),
  u.email,
  'non_teaching'::staff_member_type,
  'Principal',
  p.created_at::date,
  'active'::staff_member_status,
  'admin',
  'Admin'
from profiles p
join auth.users u on u.id = p.id
where p.role = 'admin'
  and p.school_id is not null
  and not exists (
    select 1 from staff_members sm where sm.profile_id = p.id
  );
