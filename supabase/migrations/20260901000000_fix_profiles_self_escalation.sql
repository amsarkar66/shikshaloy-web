-- The "profiles: update own" policy (using (id = auth.uid())) has no WITH
-- CHECK clause, so it lets a signed-in user write ANY new value onto their
-- own row via the normal Supabase client — including
--   update profiles set role = 'kernel' where id = auth.uid()
-- auth_role() (used as the tenant/permission gate on nearly every other RLS
-- policy in this schema) reads straight from profiles.role, so this one gap
-- lets any user grant themselves platform-owner access and defeats RLS
-- tenant isolation database-wide.
--
-- Fixed with a BEFORE UPDATE trigger rather than a WITH CHECK clause: a
-- WITH CHECK subquery that reads the "old" value of the same row being
-- updated is fragile to get right, while a trigger cleanly compares OLD vs
-- NEW and — critically — is skipped for service-role writes (auth.role() =
-- 'service_role'), so every existing server action that legitimately
-- changes profiles.role/status/school_id via supabaseAdmin (which bypasses
-- RLS entirely already) keeps working unmodified.
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
     or new.school_id is distinct from old.school_id then
    raise exception 'Not permitted to change role, status, or school_id on your own profile';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;

create trigger trg_prevent_profile_privilege_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_escalation();
