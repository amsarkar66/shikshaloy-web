-- handle_new_user() had no search_path pinned, so under the restricted role
-- that runs public self-serve signups, the unqualified `profiles` reference
-- failed to resolve ("relation profiles does not exist"), aborting every
-- public signup. Admin-created users (seed scripts, lib/students/enroll.ts)
-- run under a different role and were unaffected. Supabase's documented
-- best practice for SECURITY DEFINER trigger functions is to always pin
-- search_path explicitly.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, status, school_id)
  values (
    new.id,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'status'), 'active')::account_status,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
