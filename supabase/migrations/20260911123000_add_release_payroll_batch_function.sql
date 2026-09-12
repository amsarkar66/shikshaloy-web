-- processAllPending() in app/dashboard/payroll/actions.ts generated a
-- single slip_no and applied it to every matching row in one bulk update —
-- every staff member released in the same batch got the identical
-- payslip number. This assigns a distinct slip_no per row in one
-- statement via row_number(), so a batch release is still atomic but each
-- payslip gets its own number.
create or replace function release_payroll_batch(
  p_school_id uuid,
  p_month_str text,
  p_paid_on date
) returns void
language sql
security definer
set search_path = public
as $$
  with pending as (
    select id, row_number() over (order by id) - 1 as rn
    from payroll_records
    where school_id = p_school_id and month_str = p_month_str and status = 'pending'
  )
  update payroll_records pr
  set status = 'processed',
      paid_on = p_paid_on,
      pay_mode = 'bank_transfer',
      slip_no = 'SLP-' || replace(p_month_str, '-', '') || '-' || lpad((1000 + pending.rn)::text, 4, '0'),
      updated_at = now()
  from pending
  where pr.id = pending.id;
$$;

revoke all on function release_payroll_batch(uuid, text, date) from public, anon, authenticated;
