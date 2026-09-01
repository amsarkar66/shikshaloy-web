"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { requireRole } from "@/lib/auth/verified-role";
import { randomPassword } from "@/lib/auth/random-password";
import { sendStaffInviteEmail } from "@/lib/email/resend";
import { logAuditEvent } from "@/lib/audit/log";
import type { DriverStatus } from "./_data/drivers";

async function requireSchoolAdmin() {
  return requireRole(["admin", "super_admin"]);
}

// ── Add driver ───────────────────────────────────────────────────────────────

export interface InviteDriverInput {
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
}

export async function inviteDriver(input: InviteDriverInput): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  if (!email || !fullName) throw new Error("Name and email are required");

  const password = randomPassword();
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "driver",
      full_name: fullName,
      school_id: schoolId,
      status: "active",
    },
  });

  if (authError || !authUser?.user) {
    throw new Error(authError?.message ?? "Failed to create account");
  }

  if (phone) {
    await supabaseAdmin.from("profiles").update({ phone }).eq("id", authUser.user.id);
  }

  const { error: insertError } = await supabaseAdmin.from("staff_members").insert({
    school_id: schoolId,
    profile_id: authUser.user.id,
    employee_id: input.employeeId.trim() || null,
    full_name: fullName,
    phone: phone || null,
    email,
    type: "non_teaching",
    designation: "Driver",
    joined_date: new Date().toISOString().slice(0, 10),
    status: "active",
  });

  if (insertError) {
    throw new Error(`Account created but failed to add driver record: ${insertError.message}`);
  }

  await sendStaffInviteEmail({ to: email, fullName, loginEmail: email, loginPassword: password });

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Drivers",
    description: `Added new driver — ${fullName}`,
  });

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/transport");
}

// ── Edit driver ──────────────────────────────────────────────────────────────

export interface UpdateDriverInput {
  profileId: string;
  staffId: string | null;
  fullName: string;
  phone: string;
  employeeId: string;
  status: DriverStatus;
}

export async function updateDriver(input: UpdateDriverInput): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Name is required");
  const phone = input.phone.trim() || null;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
    .eq("id", input.profileId)
    .eq("school_id", schoolId);

  if (profileError) throw new Error(`Failed to update driver: ${profileError.message}`);

  if (input.staffId) {
    const { error: staffError } = await supabaseAdmin
      .from("staff_members")
      .update({
        full_name: fullName,
        phone,
        employee_id: input.employeeId.trim() || null,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.staffId)
      .eq("school_id", schoolId);

    if (staffError) throw new Error(`Failed to update driver record: ${staffError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Drivers",
    description: `Updated driver details — ${fullName}`,
  });

  revalidatePath("/dashboard/drivers");
  revalidatePath("/dashboard/transport");
}
