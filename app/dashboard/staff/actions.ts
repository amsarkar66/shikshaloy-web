"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { randomPassword } from "@/lib/auth/random-password";
import { sendStaffInviteEmail } from "@/lib/email/resend";
import { logAuditEvent } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/verified-role";

async function requireSchoolAdmin() {
  return requireRole(["admin", "super_admin"]);
}

// ── Permission template assignment ───────────────────────────────────────────

export async function assignStaffTemplate(
  staffId: string,
  templateId: string,
  templateName: string
): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await resolveAuthorizedSchoolId("staff_members", staffId);

  const { data: staff, error } = await supabaseAdmin
    .from("staff_members")
    .update({
      permission_template_id: templateId || null,
      permission_template_name: templateName || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .eq("school_id", schoolId)
    .select("full_name")
    .single();

  if (error) throw new Error(`Failed to update permission template: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Staff",
    description: templateName
      ? `Set permission template for ${staff.full_name} to '${templateName}'`
      : `Cleared permission template for ${staff.full_name}`,
  });

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

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Staff",
    description: `Invited new staff member — ${fullName} (${input.designation || input.type})`,
  });

  revalidatePath("/dashboard/staff");
}

// ── Edit staff member ────────────────────────────────────────────────────────

export interface StaffEditData {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  status: "active" | "on_leave" | "inactive";
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  licenseNumber: string;
  licenseExpiry: string;
}

export async function getStaffForEdit(staffId: string): Promise<StaffEditData> {
  await requireSchoolAdmin();
  const schoolId = await resolveAuthorizedSchoolId("staff_members", staffId);

  const { data } = await supabaseAdmin
    .from("staff_members")
    .select("id, full_name, phone, email, designation, department, status, blood_group, address, emergency_contact_name, emergency_contact_phone, license_number, license_expiry")
    .eq("school_id", schoolId)
    .eq("id", staffId)
    .maybeSingle();

  if (!data) throw new Error("Staff member not found");

  return {
    id: data.id,
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    designation: data.designation ?? "",
    department: data.department ?? "",
    status: (data.status ?? "active") as StaffEditData["status"],
    bloodGroup: data.blood_group ?? "",
    address: data.address ?? "",
    emergencyContactName: data.emergency_contact_name ?? "",
    emergencyContactPhone: data.emergency_contact_phone ?? "",
    licenseNumber: data.license_number ?? "",
    licenseExpiry: data.license_expiry ?? "",
  };
}

export interface UpdateStaffInput {
  staffId: string;
  fullName: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  status: "active" | "on_leave" | "inactive";
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
}

export async function updateStaff(input: UpdateStaffInput): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await resolveAuthorizedSchoolId("staff_members", input.staffId);

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Staff name is required");

  const { data: staff, error } = await supabaseAdmin
    .from("staff_members")
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
      designation: input.designation?.trim() || null,
      department: input.department?.trim() || null,
      status: input.status,
      blood_group: input.bloodGroup?.trim() || null,
      address: input.address?.trim() || null,
      emergency_contact_name: input.emergencyContactName?.trim() || null,
      emergency_contact_phone: input.emergencyContactPhone?.trim() || null,
      license_number: input.licenseNumber?.trim() || null,
      license_expiry: input.licenseExpiry?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.staffId)
    .eq("school_id", schoolId)
    .select("full_name")
    .single();

  if (error || !staff) throw new Error(`Failed to update staff member: ${error?.message ?? "unknown error"}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Staff",
    description: `Updated staff profile — ${fullName}`,
  });

  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/staff/${input.staffId}`);
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

  if (outcome.succeeded > 0) {
    await logAuditEvent({
      schoolId,
      action: "create",
      module: "Staff",
      description: `Bulk-imported ${outcome.succeeded} staff member${outcome.succeeded === 1 ? "" : "s"}`,
    });
  }

  revalidatePath("/dashboard/staff");
  return outcome;
}
