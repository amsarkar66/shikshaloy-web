"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getSchoolCapacity } from "@/lib/billing/plan-limits";
import type { SchoolFormData } from "@/app/onboarding/_school-onboarding-form";

export interface UpdateSchoolInput {
  schoolId: string;
  name: string;
  institutionType: string;
  establishedYear: number | null;
  status: "active" | "inactive" | "pending";
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  principalName: string | null;
  principalEmail: string | null;
}

export async function updateSchool(input: UpdateSchoolInput): Promise<void> {
  const {
    data: { user },
  } = await getUser();
  if (!user) throw new Error("Unauthorized");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: existing } = await supabaseAdmin
    .from("schools")
    .select("institution_id")
    .eq("id", input.schoolId)
    .maybeSingle();
  if (!existing || existing.institution_id !== institutionId) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from("schools")
    .update({
      name: input.name,
      institution_type: input.institutionType || null,
      established_year: input.establishedYear,
      status: input.status,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      country: input.country || null,
      phone: input.phone || null,
      website: input.website || null,
      logo_url: input.logoUrl || null,
      principal_name: input.principalName || null,
      principal_email: input.principalEmail || null,
    })
    .eq("id", input.schoolId);

  if (error) throw new Error(`Failed to update school: ${error.message}`);

  revalidatePath("/dashboard/schools");
  revalidatePath(`/dashboard/schools/${input.schoolId}/edit`);
}

export async function createAdditionalSchool(input: SchoolFormData): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await getUser();
  if (!user || user.user_metadata?.role !== "super_admin") {
    return { error: "Unauthorized." };
  }

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { maxSchools, schoolsUsed: currentCount, atCapacity } = await getSchoolCapacity(institutionId);
  if (atCapacity) {
    return { error: `Your plan allows up to ${maxSchools} school${maxSchools === 1 ? "" : "s"}. Upgrade your plan to add another.` };
  }

  const { data: school, error } = await supabaseAdmin
    .from("schools")
    .insert({
      institution_id: institutionId,
      name: input.name,
      short_name: input.shortName || null,
      board: input.board || null,
      established_year: input.established ? Number(input.established) : null,
      grades_from: input.gradesFrom || null,
      grades_to: input.gradesTo || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pin_code: input.pin || null,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      principal_name: input.principalName || null,
      principal_email: input.principalEmail || null,
      principal_phone: input.principalPhone || null,
      principal_designation: input.principalDesignation || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !school) {
    return { error: "Could not add the new school. Please try again." };
  }

  await supabaseAdmin
    .from("school_subscriptions")
    .update({ schools_used: currentCount + 1 })
    .eq("institution_id", institutionId);

  const today = new Date();
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  await supabaseAdmin.from("academic_years").insert({
    school_id: school.id,
    name: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
    start_date: `${startYear}-04-01`,
    end_date: `${startYear + 1}-03-31`,
    is_current: true,
  });

  revalidatePath("/dashboard/schools");
  revalidatePath("/dashboard");
  return {};
}
