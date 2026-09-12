-- Backstops generateMonthlyFees() in app/dashboard/fees/actions.ts, which
-- deduped against an in-memory Set with no DB constraint behind it —
-- concurrent/double-click invocations could insert duplicate fee line
-- items for the same student/month/category, inflating the amount due.
alter table fee_payments
  add constraint fee_payments_student_month_category_key unique (student_id, month_str, category);
