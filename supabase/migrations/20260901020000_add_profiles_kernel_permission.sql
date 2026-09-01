-- kernel_permission (owner/admin/viewer, see lib/kernel-permissions.ts) was
-- only ever stored in the JWT's user_metadata, which a signed-in user can
-- rewrite themselves via `supabase.auth.updateUser()` — so any account that
-- had already self-escalated `role` to 'kernel' could just as easily grant
-- itself the 'owner' tier. Store it in `profiles` (server-controlled) like
-- every other authorization field.
alter table public.profiles add column if not exists kernel_permission text;

-- kernel_permission is exactly as sensitive as role/status/school_id (it's
-- the owner/admin/viewer tier within the kernel role), so it needs the same
-- self-escalation protection added in 20260901000000_fix_profiles_self_escalation.sql
-- — redefine the trigger function now that the column exists.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.school_id is distinct from old.school_id
     or new.kernel_permission is distinct from old.kernel_permission then
    raise exception 'Not permitted to change role, status, school_id, or kernel_permission on your own profile';
  end if;

  return new;
end;
$$;

-- Copy kernel_permission from the JWT the same way handle_new_user() already
-- copies role/full_name/status/school_id, so newly-created kernel accounts
-- (app/dashboard/team/actions.ts inviteTeamMember) get it automatically.
-- `set search_path = public` is required here — 20260808010000 added it to
-- fix "relation profiles does not exist" on public self-signup (the
-- restricted role that runs the trigger doesn't have `public` on its
-- default search_path), and a `create or replace` without repeating it
-- silently drops the clause and reintroduces that exact failure.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, status, school_id, kernel_permission)
  values (
    new.id,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'status'), 'active')::account_status,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    new.raw_user_meta_data->>'kernel_permission'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill existing kernel accounts from their current JWT metadata so
-- access doesn't regress for accounts created before this column existed.
update public.profiles p
set kernel_permission = u.raw_user_meta_data->>'kernel_permission'
from auth.users u
where p.id = u.id
  and p.role = 'kernel'
  and p.kernel_permission is null;
