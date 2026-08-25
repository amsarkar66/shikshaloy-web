"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateInstitutionStatus } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { sendInstitutionDecisionEmail } from "@/lib/email/resend";
import { PLANS } from "./billing/_data/billing";

// audit_log.school_id is a not-null FK to `schools`, so an institution-level
// decision is logged against its primary (oldest) school — there's no
// institution-level row to point at.
async function logInstitutionDecision(
  schoolId: string,
  action: "approve" | "reject",
  description: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabaseAdmin.from("audit_log").insert({
    school_id: schoolId,
    actor_name: (user.user_metadata?.full_name as string) || user.email || "Product Owner",
    actor_role: "kernel",
    action,
    module: "Institutions",
    description,
  });
}

export async function approveInstitution(formData: FormData) {
  const institutionId = formData.get("institutionId") as string;
  const planId = formData.get("planId") as string | null;
  const plan = planId ? PLANS.find((p) => p.id === planId) : undefined;

  const result = await updateInstitutionStatus(
    institutionId,
    "active",
    plan
      ? { id: plan.id, name: plan.name, maxSchools: plan.schools ?? 999, monthlyFee: plan.price ?? 0 }
      : undefined
  );

  if (result?.ownerEmail) {
    await sendInstitutionDecisionEmail({
      to: result.ownerEmail,
      schoolName: result.institutionName,
      decision: "active",
    });
  }

  if (result?.primarySchoolId) {
    await logInstitutionDecision(
      result.primarySchoolId,
      "approve",
      `Approved ${result.institutionName}${plan ? ` on the ${plan.name} plan` : ""}`
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/institutions");
  revalidatePath("/dashboard/audit-log");
}

export async function rejectInstitution(formData: FormData) {
  const institutionId = formData.get("institutionId") as string;
  const result = await updateInstitutionStatus(institutionId, "rejected");

  if (result?.ownerEmail) {
    await sendInstitutionDecisionEmail({
      to: result.ownerEmail,
      schoolName: result.institutionName,
      decision: "rejected",
    });
  }

  if (result?.primarySchoolId) {
    await logInstitutionDecision(result.primarySchoolId, "reject", `Rejected ${result.institutionName}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/institutions");
  revalidatePath("/dashboard/audit-log");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signOutToDemo() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/demo");
}
