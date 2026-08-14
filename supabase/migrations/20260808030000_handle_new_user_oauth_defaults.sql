-- OAuth signups (Google, etc.) never carry a `role`/`status` in
-- raw_user_meta_data the way our own signUp() calls and admin-created users
-- always do, since Supabase populates OAuth metadata straight from the
-- provider's profile. Without a default, the `role` NOT NULL constraint on
-- profiles rejects the insert and the whole auth.users transaction (trigger
-- runs inside it) rolls back, so Google sign-in fails outright. Every path
-- that DOES pass role/status already passes both explicitly, so defaulting
-- to the same super_admin/pending pair our public signup form hardcodes is
-- safe and correct: an OAuth user with no metadata is, by definition, a
-- self-serve signup through that same form.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, status, school_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'super_admin')::user_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'status', 'pending')::account_status,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
