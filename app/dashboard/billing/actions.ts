"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import { PLANS, type PlanId } from "./_data/billing";

export async function changePlan(planId: PlanId) {
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
    .eq("school_id", DEMO_SCHOOL_ID);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/billing");
}

export async function cancelSubscription() {
  const { error } = await supabaseAdmin
    .from("school_subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("school_id", DEMO_SCHOOL_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/billing");
}
