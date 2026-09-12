-- Backstops the idempotency check in lib/billing/fulfill-razorpay-payment.ts:
-- two concurrent Razorpay webhook deliveries for the same payment.captured
-- event could otherwise both pass a check-then-insert race and create
-- duplicate invoices. NULLs (non-Razorpay invoices) are unaffected.
create unique index if not exists subscription_invoices_razorpay_payment_id_key
  on subscription_invoices (razorpay_payment_id)
  where razorpay_payment_id is not null;
