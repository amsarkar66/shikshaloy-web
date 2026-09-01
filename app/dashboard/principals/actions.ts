"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { requireRole } from "@/lib/auth/verified-role";
import { randomPassword } from "@/lib/auth/random-password";
import { sendPrincipalCredentialsEmail } from "@/lib/email/resend";

async function requireInstitutionOwner() {
  return requireRole(["super_admin"]);
}

export interface InvitePrincipalInput {
  fullName: string;
  email: string;
  schoolId: string;
}

export async function invitePrincipal(input: InvitePrincipalInput): Promise<void> {
  await requireInstitutionOwner();
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email || !fullName) throw new Error("Name and email are required");
  if (!input.schoolId) throw new Error("Select a school");

  const { data: school, error: schoolError } = await supabaseAdmin
    .from("schools")
    .select("id, name, institution_id")
    .eq("id", input.schoolId)
    .maybeSingle();

  if (schoolError || !school || school.institution_id !== institutionId) {
    throw new Error("Unauthorized");
  }

  const password = randomPassword();
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "admin",
      full_name: fullName,
      school_id: school.id,
      status: "active",
    },
  });

  if (authError || !authUser?.user) {
    throw new Error(authError?.message ?? "Failed to create account");
  }

  const { error: schoolUpdateError } = await supabaseAdmin
    .from("schools")
    .update({ principal_name: fullName, principal_email: email })
    .eq("id", school.id);

  if (schoolUpdateError) {
    throw new Error(`Account created but failed to update school record: ${schoolUpdateError.message}`);
  }

  await sendPrincipalCredentialsEmail({
    to: email,
    principalName: fullName,
    schoolName: school.name,
    loginEmail: email,
    loginPassword: password,
  });

  revalidatePath("/dashboard/principals");
  revalidatePath("/dashboard/schools");
}
