"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { createRazorpayOrder as createOrder, verifyRazorpaySignature } from "@/lib/razorpay";
import { sendOfflinePaymentSubmittedEmail } from "@/lib/email/resend";
import { PLANS, formatDate, generateInvoiceNo, type PlanId } from "./_data/billing";

function renewsOnFromToday(): { issuedIso: string; renewsIso: string } {
  const today = new Date();
  const renews = new Date(today);
  renews.setMonth(renews.getMonth() + 1);
  return {
    issuedIso: today.toISOString().slice(0, 10),
    renewsIso: renews.toISOString().slice(0, 10),
  };
}

export async function createRazorpayOrder(planId: PlanId) {
  const institutionId = await getCurrentInstitutionIdOrThrow();
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === null) throw new Error("Contact sales for this plan");

  const receipt = `plan-${planId}-${institutionId.slice(0, 8)}-${Date.now()}`;
  const order = await createOrder(plan.price * 100, receipt);

  return {
    orderId: order.id,
    amount: plan.price,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  };
}

export async function verifyRazorpayPayment(input: {
  planId: PlanId;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const ok = verifyRazorpaySignature({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
  });
  if (!ok) throw new Error("Payment verification failed");

  const plan = PLANS.find((p) => p.id === input.planId);
  if (!plan || plan.price === null) throw new Error("Invalid plan");

  const { issuedIso, renewsIso } = renewsOnFromToday();

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
      payment_method_summary: "Razorpay",
      updated_at: new Date().toISOString(),
    })
    .eq("institution_id", institutionId);
  if (subError) throw new Error(subError.message);

  const { error: invError } = await supabaseAdmin.from("subscription_invoices").insert({
    institution_id: institutionId,
    invoice_no: generateInvoiceNo(),
    period_label: `${formatDate(issuedIso)} – ${formatDate(renewsIso)}`,
    plan_id: plan.id,
    plan_name: plan.name,
    amount: plan.price,
    status: "paid",
    issued_date: issuedIso,
    payment_method: "razorpay",
    razorpay_order_id: input.orderId,
    razorpay_payment_id: input.paymentId,
  });
  if (invError) throw new Error(invError.message);

  revalidatePath("/dashboard/billing");
}

export async function submitOfflinePayment(formData: FormData) {
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const planId = formData.get("planId") as PlanId | null;
  const reference = (formData.get("reference") as string | null)?.trim();
  const note = (formData.get("note") as string | null)?.trim() || null;
  const file = formData.get("receipt") as File | null;

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === null) throw new Error("Invalid plan");
  if (!reference) throw new Error("Payment reference is required");
  if (!file || file.size === 0) throw new Error("Receipt upload is required");

  const { data: existingPending } = await supabaseAdmin
    .from("subscription_invoices")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("status", "pending")
    .eq("payment_method", "offline")
    .maybeSingle();
  if (existingPending) throw new Error("You already have a payment awaiting verification.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${institutionId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("payment-receipts")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Failed to upload receipt: ${uploadError.message}`);

  const { data: urlData } = supabaseAdmin.storage.from("payment-receipts").getPublicUrl(path);

  const { issuedIso, renewsIso } = renewsOnFromToday();

  const { error: invError } = await supabaseAdmin.from("subscription_invoices").insert({
    institution_id: institutionId,
    invoice_no: generateInvoiceNo(),
    period_label: `${formatDate(issuedIso)} – ${formatDate(renewsIso)}`,
    plan_id: plan.id,
    plan_name: plan.name,
    amount: plan.price,
    status: "pending",
    issued_date: issuedIso,
    payment_method: "offline",
    offline_reference: reference,
    offline_note: note,
    offline_receipt_url: urlData.publicUrl,
  });
  if (invError) throw new Error(invError.message);

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .maybeSingle();

  await sendOfflinePaymentSubmittedEmail({
    institutionName: institution?.name ?? "An institution",
    planName: plan.name,
    amount: plan.price,
    reference,
  });

  revalidatePath("/dashboard/billing");
}

export async function cancelSubscription() {
  const institutionId = await getCurrentInstitutionIdOrThrow();
  const { error } = await supabaseAdmin
    .from("school_subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("institution_id", institutionId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/billing");
}
