"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { requireRole } from "@/lib/auth/verified-role";
import {
  createRazorpayOrder as createOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
} from "@/lib/razorpay";
import { fulfillRazorpayPayment } from "@/lib/billing/fulfill-razorpay-payment";
import { sendOfflinePaymentSubmittedEmail } from "@/lib/email/resend";
import { PLANS, formatDate, generateInvoiceNo, renewsOnFromToday, type PlanId } from "./_data/billing";

// Billing is an institution-owner (super_admin) feature only — everyone else
// (admin, staff, teacher, parent, student, driver) can resolve an
// institution id via their school, but must never be able to touch its
// subscription or payment state.
async function assertSuperAdmin() {
  try {
    await requireRole(["super_admin"]);
  } catch {
    throw new Error("Only the institution owner can manage billing.");
  }
}

export async function createRazorpayOrder(planId: PlanId) {
  await assertSuperAdmin();
  const institutionId = await getCurrentInstitutionIdOrThrow();
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === null) throw new Error("Contact sales for this plan");

  const receipt = `plan-${planId}-${institutionId.slice(0, 8)}-${Date.now()}`;
  const order = await createOrder(plan.price * 100, receipt, { institutionId, planId });

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
  await assertSuperAdmin();
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const ok = verifyRazorpaySignature({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
  });
  if (!ok) throw new Error("Payment verification failed");

  // Never trust the client-supplied planId — a valid signature only proves
  // *some* order/payment pair was completed, not which plan it paid for.
  // Re-derive institutionId/planId from the order Razorpay itself created
  // (same pattern the webhook handler already uses), and confirm the order
  // actually belongs to this institution before fulfilling it.
  const order = await fetchRazorpayOrder(input.orderId);
  const orderInstitutionId = order.notes?.institutionId;
  const orderPlanId = order.notes?.planId as PlanId | undefined;
  if (orderInstitutionId !== institutionId) throw new Error("This payment does not belong to your institution.");
  if (!orderPlanId || !PLANS.some((p) => p.id === orderPlanId)) throw new Error("Invalid plan on this order.");

  const payment = await fetchRazorpayPayment(input.paymentId);
  if (payment.order_id !== input.orderId) throw new Error("Payment does not match order.");

  await fulfillRazorpayPayment({
    institutionId,
    planId: orderPlanId,
    orderId: input.orderId,
    payment,
  });

  revalidatePath("/dashboard/billing");
}

export async function submitOfflinePayment(formData: FormData) {
  await assertSuperAdmin();
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

export async function cancelOfflinePayment(invoiceId: string) {
  await assertSuperAdmin();
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: invoice } = await supabaseAdmin
    .from("subscription_invoices")
    .select("id, institution_id, status, payment_method, offline_receipt_url")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice || invoice.institution_id !== institutionId) throw new Error("Invoice not found");
  if (invoice.payment_method !== "offline" || invoice.status !== "pending") {
    throw new Error("This payment can't be cancelled.");
  }

  const { error } = await supabaseAdmin.from("subscription_invoices").delete().eq("id", invoiceId);
  if (error) throw new Error(error.message);

  if (invoice.offline_receipt_url) {
    const marker = "/payment-receipts/";
    const idx = invoice.offline_receipt_url.indexOf(marker);
    if (idx !== -1) {
      await supabaseAdmin.storage
        .from("payment-receipts")
        .remove([invoice.offline_receipt_url.slice(idx + marker.length)]);
    }
  }

  revalidatePath("/dashboard/billing");
}

export async function switchToFreePlan() {
  await assertSuperAdmin();
  const institutionId = await getCurrentInstitutionIdOrThrow();
  const freePlan = PLANS.find((p) => p.id === "free")!;

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("institution_id", institutionId);
  const schoolIds = (schoolRows ?? []).map((s) => s.id);

  if (freePlan.schools !== null && schoolIds.length > freePlan.schools) {
    throw new Error(`The Free plan supports up to ${freePlan.schools} school. Remove extra schools first.`);
  }

  if (freePlan.maxStudents !== null && schoolIds.length > 0) {
    const { count: studentsUsed } = await supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .in("school_id", schoolIds);
    if ((studentsUsed ?? 0) > freePlan.maxStudents) {
      throw new Error(`The Free plan supports up to ${freePlan.maxStudents} students. You have more than that enrolled.`);
    }
  }

  const { error } = await supabaseAdmin
    .from("school_subscriptions")
    .update({
      plan_id: freePlan.id,
      plan_name: freePlan.name,
      max_schools: freePlan.schools,
      monthly_fee: freePlan.price,
      status: "active",
      payment_method: null,
      payment_method_summary: null,
      razorpay_method: null,
      razorpay_method_detail: null,
      updated_at: new Date().toISOString(),
    })
    .eq("institution_id", institutionId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/billing");
}

export async function cancelSubscription() {
  // Cancelling a paid plan drops the institution straight to Free — there's no
  // grace period or auto-expiry job, so "cancelled" must not leave them in a
  // limbo state still tagged with the old paid plan_id.
  await switchToFreePlan();
}
