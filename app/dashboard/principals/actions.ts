"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getVerifiedUser, type VerifiedProfile } from "@/lib/auth/verified-role";
import { assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import { randomPassword } from "@/lib/auth/random-password";
import { sendPrincipalCredentialsEmail, sendAdminPromotionEmail } from "@/lib/email/resend";
import { logAuditEvent } from "@/lib/audit/log";

async function requireInstitutionOwner(): Promise<VerifiedProfile> {
  const vu = await getVerifiedUser();
  if (!vu || vu.role !== "super_admin") throw new Error("Unauthorized");
  return vu;
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

  // Every admin needs a staff_members row too — not just for payroll/HR
  // records, but because promoteExistingToAdmin and the rest of the
  // access-role model (docs/architecture/role-and-identity-model.md)
  // assume every admin has one. Without this, newly invited principals
  // would reopen the exact gap 20260911130000_backfill_admin_staff_members
  // just closed for existing ones.
  const { error: staffInsertError } = await supabaseAdmin.from("staff_members").insert({
    school_id: school.id,
    profile_id: authUser.user.id,
    full_name: fullName,
    email,
    type: "non_teaching",
    designation: "Principal",
    joined_date: new Date().toISOString().slice(0, 10),
    status: "active",
    permission_template_id: "admin",
    permission_template_name: "Admin",
  });

  if (staffInsertError) {
    throw new Error(`Account created but failed to add staff record: ${staffInsertError.message}`);
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

// ── Promote an existing teacher/staff member to admin ───────────────────────
//
// Unlike invitePrincipal (which always creates a brand-new login), this
// upgrades an existing account in place: same auth user, same profile id,
// same staff_members row (so payroll — keyed off staff_members.id, never off
// role — keeps working unmodified). Only profiles.role/school_id and the
// staff_members permission template change.

export interface PromotableStaff {
  staffId: string;
  profileId: string;
  fullName: string;
  email: string;
  designation: string | null;
  type: "teaching" | "non_teaching";
}

export async function searchPromotableStaff(schoolId: string, query: string): Promise<PromotableStaff[]> {
  const vu = await requireInstitutionOwner();
  await assertAuthorizedSchool(vu, schoolId);

  const q = query.trim();
  if (q.length < 2) return [];

  const { data } = await supabaseAdmin
    .from("staff_members")
    .select("id, profile_id, full_name, email, designation, type")
    .eq("school_id", schoolId)
    .not("profile_id", "is", null)
    .ilike("full_name", `%${q}%`)
    .order("full_name")
    .limit(8);

  return (data ?? [])
    .filter((s) => s.profile_id)
    .map((s) => ({
      staffId: s.id,
      profileId: s.profile_id as string,
      fullName: s.full_name ?? "Unknown",
      email: s.email ?? "",
      designation: s.designation,
      type: s.type as "teaching" | "non_teaching",
    }));
}

export interface PromoteToAdminInput {
  staffId: string;
  schoolId: string;
}

export async function promoteExistingToAdmin(input: PromoteToAdminInput): Promise<void> {
  const vu = await requireInstitutionOwner();
  await assertAuthorizedSchool(vu, input.schoolId);

  const { data: staff, error: staffError } = await supabaseAdmin
    .from("staff_members")
    .select("id, profile_id, full_name, email, permission_template_id")
    .eq("id", input.staffId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (staffError || !staff || !staff.profile_id) {
    throw new Error("Staff member not found");
  }

  if (staff.permission_template_id === "admin") {
    throw new Error("This person already has admin access");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", staff.profile_id)
    .maybeSingle();

  if (!profile) throw new Error("This person has no login account to promote");
  if (profile.role === "admin" || profile.role === "super_admin" || profile.role === "kernel") {
    throw new Error("This person already has admin access");
  }
  if (profile.role !== "teacher" && profile.role !== "staff") {
    throw new Error("Only teachers and staff can be promoted to admin");
  }

  // Deliberately does NOT touch profiles.role/school_id — that's the
  // whole point of this model (docs/architecture/role-and-identity-model.md
  // §7-8): a promoted teacher stays a teacher (still shows up in "assign
  // teacher" pickers, keeps their teacher-only screens) and gains admin
  // access on top, via this permission_template_id grant alone. Every
  // admin-gated check (requireRole/requireRoleOrStaffTemplate/isAdmin in
  // lib/auth/verified-role.ts) reads this as an alternative to
  // profiles.role === 'admin', not a replacement for it — invitePrincipal
  // still writes profiles.role = 'admin' for brand-new admin accounts, and
  // that path is untouched.
  //
  // Not deactivated: this staff_members row is what payroll_records.staff_id
  // points at, so leaving it active/unchanged is what keeps salary
  // processing working for them as admin.
  const { error: staffUpdateError } = await supabaseAdmin
    .from("staff_members")
    .update({ permission_template_id: "admin", permission_template_name: "Admin" })
    .eq("id", staff.id);
  if (staffUpdateError) throw new Error(`Failed to grant admin access: ${staffUpdateError.message}`);

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("name")
    .eq("id", input.schoolId)
    .maybeSingle();

  await supabaseAdmin
    .from("schools")
    .update({ principal_name: staff.full_name, principal_email: staff.email })
    .eq("id", input.schoolId);

  await logAuditEvent({
    schoolId: input.schoolId,
    action: "update",
    module: "Principals",
    description: `Promoted ${staff.full_name} (was ${profile.role}) to Admin`,
  });

  if (staff.email) {
    await sendAdminPromotionEmail({
      to: staff.email,
      name: staff.full_name ?? "there",
      schoolName: school?.name ?? "your school",
    });
  }

  revalidatePath("/dashboard/principals");
  revalidatePath("/dashboard/schools");
  revalidatePath("/dashboard/staff");
}
