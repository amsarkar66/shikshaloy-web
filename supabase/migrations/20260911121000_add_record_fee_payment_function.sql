-- app/dashboard/fees/actions.ts recordFeePayment() used to read amount_paid
-- for each fee_payments row, compute the new total in JS, then write it
-- back — a lost-update race: two concurrent payments for the same
-- student/month (two staff recording cash separately, or a double-submit)
-- could both read the same stale amount_paid and the second write would
-- silently clobber the first. This does the whole allocation loop inside
-- one function with `for update` row locks, so concurrent calls serialize
-- instead of racing.
create or replace function record_fee_payment(
  p_school_id uuid,
  p_student_id uuid,
  p_month_str text,
  p_amount numeric,
  p_paid_date date,
  p_payment_mode payment_mode
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  remaining numeric := p_amount;
  applied numeric;
  new_paid numeric;
  new_status fee_status;
  receipt text;
  row_count int;
begin
  select count(*) into row_count
  from fee_payments
  where school_id = p_school_id and student_id = p_student_id and month_str = p_month_str;

  if row_count = 0 then
    raise exception 'No fee record found for this student and month';
  end if;

  select receipt_no into receipt
  from fee_payments
  where school_id = p_school_id and student_id = p_student_id and month_str = p_month_str and receipt_no is not null
  order by created_at asc
  limit 1;

  if receipt is null then
    receipt := 'RCP-' || replace(p_month_str, '-', '') || '-' || (1000 + floor(random() * 9000))::int;
  end if;

  for r in
    select id, amount_due, amount_paid
    from fee_payments
    where school_id = p_school_id and student_id = p_student_id and month_str = p_month_str
    order by created_at asc
    for update
  loop
    exit when remaining <= 0;
    continue when (r.amount_due - r.amount_paid) <= 0;

    applied := least(r.amount_due - r.amount_paid, remaining);
    new_paid := r.amount_paid + applied;
    new_status := case
      when new_paid >= r.amount_due then 'paid'
      when new_paid > 0 then 'partial'
      else 'overdue'
    end;

    update fee_payments
    set amount_paid = new_paid,
        status = new_status,
        paid_date = p_paid_date,
        payment_mode = p_payment_mode,
        receipt_no = receipt,
        updated_at = now()
    where id = r.id;

    remaining := remaining - applied;
  end loop;
end;
$$;

revoke all on function record_fee_payment(uuid, uuid, text, numeric, date, payment_mode) from public, anon, authenticated;
