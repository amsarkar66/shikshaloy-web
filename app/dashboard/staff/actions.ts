"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { randomPassword } from "@/lib/auth/random-password";
import { sendStaffInviteEmail } from "@/lib/email/resend";

async function requireSchoolAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin")) {
    throw new Error("Unauthorized");
  }
  return user;
}

// ── Permission template assignment ───────────────────────────────────────────

export async function assignStaffTemplate(
  staffId: string,
  templateId: string,
  templateName: string
): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("staff_members")
    .update({
      permission_template_id: templateId || null,
      permission_template_name: templateName || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update permission template: ${error.message}`);

  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/staff/${staffId}`);
}

// ── Invite staff member ──────────────────────────────────────────────────────

export interface InviteStaffInput {
  fullName: string;
  email: string;
  employeeId: string;
  type: "teaching" | "non_teaching";
  designation: string;
  department: string;
  templateId: string;
  templateName: string;
}

export async function inviteStaffMember(input: InviteStaffInput): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email || !fullName) throw new Error("Name and email are required");

  const password = randomPassword();
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "staff",
      full_name: fullName,
      school_id: schoolId,
      status: "active",
    },
  });

  if (authError || !authUser?.user) {
    throw new Error(authError?.message ?? "Failed to create account");
  }

  const { error: insertError } = await supabaseAdmin.from("staff_members").insert({
    school_id: schoolId,
    profile_id: authUser.user.id,
    employee_id: input.employeeId.trim() || null,
    full_name: fullName,
    email,
    type: input.type,
    designation: input.designation.trim() || null,
    department: input.department.trim() || null,
    joined_date: new Date().toISOString().slice(0, 10),
    status: "active",
    permission_template_id: input.templateId || null,
    permission_template_name: input.templateName || null,
  });

  if (insertError) {
    throw new Error(`Account created but failed to add staff record: ${insertError.message}`);
  }

  await sendStaffInviteEmail({ to: email, fullName, loginEmail: email, loginPassword: password });

  revalidatePath("/dashboard/staff");
}

// ── Bulk import ───────────────────────────────────────────────────────────────

export interface BulkImportStaffRow {
  name: string;
  employeeId: string;
  type: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
}

export interface BulkImportOutcome {
  succeeded: number;
  failed: Array<{ row: string; reason: string }>;
}

export async function bulkImportStaff(rows: BulkImportStaffRow[]): Promise<BulkImportOutcome> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const outcome: BulkImportOutcome = { succeeded: 0, failed: [] };

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) {
      outcome.failed.push({ row: row.name || "(unnamed)", reason: "Missing name" });
      continue;
    }
    const { error } = await supabaseAdmin.from("staff_members").insert({
      school_id: schoolId,
      employee_id: row.employeeId.trim() || null,
      full_name: name,
      phone: row.phone.trim() || null,
      email: row.email.trim() || null,
      type: row.type.toLowerCase().includes("non") ? "non_teaching" : "teaching",
      designation: row.designation.trim() || null,
      department: row.department.trim() || null,
      joined_date: new Date().toISOString().slice(0, 10),
      status: "active",
    });
    if (error) {
      outcome.failed.push({ row: name, reason: error.message });
    } else {
      outcome.succeeded += 1;
    }
  }

  revalidatePath("/dashboard/staff");
  return outcome;
}
