-- Fixes Postgres error 42P17 "infinite recursion detected in policy for
-- relation institutions": the institutions SELECT policy queried `schools`
-- directly, and schools' own SELECT policy queried `institutions`
-- directly — so evaluating either policy re-triggered the other in a
-- loop. This never surfaced before because every web read of `institutions`
-- goes through the service-role client (bypasses RLS entirely); the
-- mobile app's institution lookup is the first caller to hit this path
-- under RLS.
--
-- Fix: route both cross-table lookups through security-definer helper
-- functions (same pattern as the existing auth_school_id()), so looking
-- one up doesn't re-invoke RLS on the other table.

create or replace function auth_institution_id()
  returns uuid language sql security definer stable as $$
  select institution_id from schools where id = auth_school_id();
$$;

create or replace function auth_owned_institution_id()
  returns uuid language sql security definer stable as $$
  select id from institutions where owner_id = auth.uid();
$$;

drop policy "institutions: owner and members can read" on institutions;
create policy "institutions: owner and members can read"
  on institutions for select
  using (owner_id = auth.uid() or id = auth_institution_id());

drop policy "schools: members read" on schools;
create policy "schools: members read"
  on schools for select
  using (
    institution_id = auth_owned_institution_id()
    or id = auth_school_id()
    or auth_role() = 'kernel'
  );

-- Same raw-subquery pattern, not itself recursive (institutions/schools
-- policies don't query these tables back) but switched to the same
-- helpers for consistency and to stop re-triggering institutions' policy
-- on every read.
drop policy "school_subscriptions: institution read" on school_subscriptions;
create policy "school_subscriptions: institution read"
  on school_subscriptions for select
  using (
    institution_id = auth_owned_institution_id()
    or institution_id = auth_institution_id()
    or auth_role() = 'kernel'
  );

drop policy "subscription_invoices: institution read" on subscription_invoices;
create policy "subscription_invoices: institution read"
  on subscription_invoices for select
  using (
    institution_id = auth_owned_institution_id()
    or institution_id = auth_institution_id()
    or auth_role() = 'kernel'
  );
