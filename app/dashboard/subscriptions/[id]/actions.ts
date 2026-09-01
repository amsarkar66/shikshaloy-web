"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getInstitution } from "@/lib/supabase/admin";
import { sendOfflinePaymentDecisionEmail } from "@/lib/email/resend";
import { PLANS, type PlanId, type SubscriptionStatus } from "@/app/dashboard/billing/_data/billing";
import { requireKernel as requireVerifiedKernel } from "@/lib/auth/verified-role";

async function requireKernel() {
  const { id } = await requireVerifiedKernel();
  return { id };
}

export async function updateSubscriptionPlan(institutionId: string, planId: PlanId) {
  await requireKernel();
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan || plan.price === null) throw new Error("Contact sales for this plan");

  const { error } = await supabaseAdmin
    .from("school_subscriptions")
    .update({
      plan_id: plan.id,
      plan_name: plan.name,
      max_schools: plan.schools,
      monthly_fee: plan.price,
      updated_at: new Date().toISOString(),
    })
    .eq("institution_id", institutionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/subscriptions/${institutionId}`);
  revalidatePath("/dashboard/subscriptions");
}

export async function updateSubscriptionStatus(institutionId: string, status: SubscriptionStatus) {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("school_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("institution_id", institutionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/subscriptions/${institutionId}`);
  revalidatePath("/dashboard/subscriptions");
}

export async function verifyOfflinePayment(invoiceId: string) {
  const kernelUser = await requireKernel();

  const { data: inv } = await supabaseAdmin
    .from("subscription_invoices")
    .select("id, institution_id, plan_id, plan_name, status, payment_method")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv || inv.status !== "pending" || inv.payment_method !== "offline") {
    throw new Error("Nothing to verify");
  }

  const plan = PLANS.find((p) => p.id === inv.plan_id) ?? PLANS.find((p) => p.name === inv.plan_name);
  if (!plan || plan.price === null) throw new Error("Unknown plan on invoice");

  const today = new Date();
  const renews = new Date(today);
  renews.setMonth(renews.getMonth() + 1);

  const { error: subError } = await supabaseAdmin
    .from("school_subscriptions")
    .update({
      plan_id: plan.id,
      plan_name: plan.name,
      max_schools: plan.schools,
      monthly_fee: plan.price,
      status: "active",
      renews_on: renews.toISOString().slice(0, 10),
      payment_method: "offline",
      payment_method_summary: "Bank transfer (offline)",
      updated_at: new Date().toISOString(),
    })
    .eq("institution_id", inv.institution_id);
  if (subError) throw new Error(subError.message);

  const { error: invError } = await supabaseAdmin
    .from("subscription_invoices")
    .update({
      status: "paid",
      verified_by: kernelUser.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  if (invError) throw new Error(invError.message);

  const result = await getInstitution(inv.institution_id);
  if (result?.institution.owner_email) {
    await sendOfflinePaymentDecisionEmail({
      to: result.institution.owner_email,
      schoolName: result.institution.name ?? "Your institution",
      planName: plan.name,
      decision: "verified",
    });
  }

  revalidatePath(`/dashboard/subscriptions/${inv.institution_id}`);
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/billing");
}

export async function rejectOfflinePayment(invoiceId: string, reason?: string) {
  const kernelUser = await requireKernel();

  const { data: inv } = await supabaseAdmin
    .from("subscription_invoices")
    .select("id, institution_id, plan_name, status, payment_method")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv || inv.status !== "pending" || inv.payment_method !== "offline") {
    throw new Error("Nothing to reject");
  }

  const { error } = await supabaseAdmin
    .from("subscription_invoices")
    .update({
      status: "failed",
      verified_by: kernelUser.id,
      verified_at: new Date().toISOString(),
      offline_note: reason || null,
    })
    .eq("id", invoiceId);
  if (error) throw new Error(error.message);

  const result = await getInstitution(inv.institution_id);
  if (result?.institution.owner_email) {
    await sendOfflinePaymentDecisionEmail({
      to: result.institution.owner_email,
      schoolName: result.institution.name ?? "Your institution",
      planName: inv.plan_name,
      decision: "rejected",
      reason,
    });
  }

  revalidatePath(`/dashboard/subscriptions/${inv.institution_id}`);
  revalidatePath("/dashboard/subscriptions");
}
