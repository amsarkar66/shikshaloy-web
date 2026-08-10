"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { PLANS } from "@/app/dashboard/billing/_data/billing";
import type { InstitutionFormData } from "./_institution-form";

export async function submitOnboarding(
  input: InstitutionFormData
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await getUser();
  if (!user || user.user_metadata?.role !== "super_admin") {
    return { error: "Unauthorized." };
  }
  if (!user.phone_confirmed_at) {
    return { error: "Please verify your phone number first." };
  }

  const { data: existing } = await supabaseAdmin
    .from("schools")
    .select("id, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only a rejected application can be resubmitted in place — anything else
  // (pending/active) already went through onboarding once.
  if (existing && existing.status !== "rejected") {
    return { error: "You've already completed onboarding." };
  }

  const fields = {
    name: input.name,
    institution_type: input.institutionType,
    board: input.board || null,
    established_year: input.establishedYear ? Number(input.establishedYear) : null,
    city: input.city,
    state: input.state,
    country: input.country || "India",
    address: input.address || null,
    pin_code: input.pinCode || null,
    student_range: input.studentRange || null,
    staff_range: input.staffRange || null,
    grades_from: input.gradesFrom || null,
    grades_to: input.gradesTo || null,
    tagline: input.tagline || null,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    udise_code: input.udiseCode || null,
    status: "pending" as const,
  };

  let schoolId: string;

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from("schools")
      .update(fields)
      .eq("id", existing.id);
    if (updateError) {
      return { error: "Could not resubmit your institution. Please try again." };
    }
    schoolId = existing.id;
  } else {
    const { data: school, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({ owner_id: user.id, ...fields })
      .select("id")
      .single();
    if (schoolError || !school) {
      return { error: "Could not create your institution. Please try again." };
    }
    schoolId = school.id;

    // Resubmissions already have a subscription row from their first
    // attempt (school_id is unique on school_subscriptions) — only
    // brand-new institutions need one created.
    const starter = PLANS.find((p) => p.id === "starter")!;
    const renewsOn = new Date();
    renewsOn.setDate(renewsOn.getDate() + 30);

    await supabaseAdmin.from("school_subscriptions").insert({
      school_id: schoolId,
      plan_id: starter.id,
      plan_name: starter.name,
      status: "active",
      schools_used: 1,
      max_schools: starter.schools ?? 1,
      monthly_fee: starter.price ?? 0,
      renews_on: renewsOn.toISOString().slice(0, 10),
    });
  }

  revalidatePath("/dashboard");
  return {};
}
