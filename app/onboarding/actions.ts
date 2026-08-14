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
  // Phone verification is temporarily optional while SMS delivery is being
  // set up — not gated on user.phone_confirmed_at for now.

  const { data: existingInstitution } = await supabaseAdmin
    .from("institutions")
    .select("id, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only a rejected application can be resubmitted in place — anything else
  // (pending/active) already went through onboarding once.
  if (existingInstitution && existingInstitution.status !== "rejected") {
    return { error: "You've already completed onboarding." };
  }

  const institutionFields = {
    name: input.name,
    type: input.institutionType,
    city: input.city,
    state: input.state,
    country: input.country || "India",
    address: input.address || null,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    status: "pending" as const,
  };

  // The first school/campus created alongside the institution — carries the
  // academic-profile fields the institution record doesn't have.
  const schoolFields = {
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

  if (existingInstitution) {
    const { error: institutionError } = await supabaseAdmin
      .from("institutions")
      .update(institutionFields)
      .eq("id", existingInstitution.id);
    if (institutionError) {
      return { error: "Could not resubmit your institution. Please try again." };
    }

    const { data: existingSchool } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("institution_id", existingInstitution.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingSchool) {
      await supabaseAdmin.from("schools").update(schoolFields).eq("id", existingSchool.id);
    }
  } else {
    const { data: institution, error: institutionError } = await supabaseAdmin
      .from("institutions")
      .insert(institutionFields)
      .select("id")
      .single();
    if (institutionError || !institution) {
      return { error: "Could not create your institution. Please try again." };
    }

    const { data: school, error: schoolError } = await supabaseAdmin
      .from("schools")
      .insert({ institution_id: institution.id, ...schoolFields })
      .select("id")
      .single();
    if (schoolError || !school) {
      return { error: "Could not create your institution. Please try again." };
    }

    // Resubmissions already have a subscription row from their first
    // attempt (institution_id is unique on school_subscriptions) — only
    // brand-new institutions need one created.
    const starter = PLANS.find((p) => p.id === "starter")!;
    const renewsOn = new Date();
    renewsOn.setDate(renewsOn.getDate() + 30);

    await supabaseAdmin.from("school_subscriptions").insert({
      institution_id: institution.id,
      plan_id: starter.id,
      plan_name: starter.name,
      status: "active",
      schools_used: 1,
      max_schools: starter.schools ?? 1,
      monthly_fee: starter.price ?? 0,
      renews_on: renewsOn.toISOString().slice(0, 10),
    });

    // Indian academic year runs Apr–Mar; before April we're still in the
    // previous cycle's year, e.g. Feb 2027 is inside the "2026-27" year.
    const today = new Date();
    const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    await supabaseAdmin.from("academic_years").insert({
      school_id: school.id,
      name: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
      start_date: `${startYear}-04-01`,
      end_date: `${startYear + 1}-03-31`,
      is_current: true,
    });
  }

  revalidatePath("/dashboard");
  return {};
}
