import { supabaseAdmin } from "@/lib/supabase/service";
import { summarizeRazorpayPayment, razorpayMethodDetail, type RazorpayPayment } from "@/lib/razorpay";
import { PLANS, formatDate, generateInvoiceNo, renewsOnFromToday, type PlanId } from "@/app/dashboard/billing/_data/billing";

export async function fulfillRazorpayPayment(input: {
  institutionId: string;
  planId: PlanId;
  orderId: string;
  payment: RazorpayPayment;
}) {
  const plan = PLANS.find((p) => p.id === input.planId);
  if (!plan || plan.price === null) throw new Error("Invalid plan");

  const paymentMethodSummary = summarizeRazorpayPayment(input.payment);
  const methodDetail = razorpayMethodDetail(input.payment);
  const { issuedIso, renewsIso } = renewsOnFromToday();

  // Insert the invoice FIRST, and let the DB-level unique constraint on
  // razorpay_payment_id (see migration
  // 20260911120000_add_subscription_invoice_payment_id_unique.sql) be the
  // atomic idempotency guard. This used to SELECT-then-INSERT: two
  // concurrent webhook deliveries for the same payment could both pass the
  // SELECT before either INSERT committed, double-fulfilling the
  // subscription. Now, whichever request's INSERT commits first "wins";
  // the other gets a 23505 unique violation and bails out here before ever
  // touching school_subscriptions.
  const { error: invError } = await supabaseAdmin.from("subscription_invoices").insert({
    institution_id: input.institutionId,
    invoice_no: generateInvoiceNo(),
    period_label: `${formatDate(issuedIso)} – ${formatDate(renewsIso)}`,
    plan_id: plan.id,
    plan_name: plan.name,
    amount: plan.price,
    status: "paid",
    issued_date: issuedIso,
    payment_method: "razorpay",
    payment_method_summary: paymentMethodSummary,
    razorpay_method: input.payment.method,
    razorpay_method_detail: methodDetail,
    razorpay_order_id: input.orderId,
    razorpay_payment_id: input.payment.id,
  });
  if (invError) {
    if (invError.code === "23505") return; // already fulfilled by a concurrent/duplicate delivery
    throw new Error(invError.message);
  }

  const { error: subError } = await supabaseAdmin
    .from("school_subscriptions")
    .update({
      plan_id: plan.id,
      plan_name: plan.name,
      max_schools: plan.schools,
      monthly_fee: plan.price,
      status: "active",
      renews_on: renewsIso,
      payment_method: "razorpay",
      payment_method_summary: paymentMethodSummary,
      razorpay_method: input.payment.method,
      razorpay_method_detail: methodDetail,
      updated_at: new Date().toISOString(),
    })
    .eq("institution_id", input.institutionId);
  if (subError) throw new Error(subError.message);
}
