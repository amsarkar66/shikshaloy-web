"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { randomPassword } from "@/lib/auth/random-password";
import { sendTeamInviteEmail } from "@/lib/email/resend";
import { KERNEL_PERMISSIONS, KERNEL_PERMISSION_LABELS, type KernelPermission } from "@/lib/kernel-permissions";
import { requireKernel as requireVerifiedKernel } from "@/lib/auth/verified-role";

async function requireKernel() {
  // Verifies role/kernel_permission against `profiles`, not the
  // self-editable user_metadata JWT claim.
  const { id, permission } = await requireVerifiedKernel();
  return { user: { id }, permission };
}

// Only Owners can grow the platform team — Admins and Viewers can see the
// roster but shouldn't be able to hand out access themselves.
async function requireKernelOwner() {
  const { user, permission } = await requireKernel();
  if (permission !== "owner") throw new Error("Only Owners can invite platform teammates");
  return user;
}

export async function inviteTeamMember(formData: FormData): Promise<void> {
  await requireKernelOwner();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("fullName") as string)?.trim();
  const rawPermission = (formData.get("permission") as string) ?? "";
  if (!email || !fullName) throw new Error("Name and email are required");
  if (!(KERNEL_PERMISSIONS as readonly string[]).includes(rawPermission)) {
    throw new Error("Choose a valid permission level");
  }
  const permission = rawPermission as KernelPermission;

  const password = randomPassword();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "kernel", full_name: fullName, kernel_permission: permission },
  });

  if (error || !data?.user) {
    throw new Error(error?.message ?? "Failed to create account");
  }

  await sendTeamInviteEmail({
    to: email,
    fullName,
    loginEmail: email,
    loginPassword: password,
    permissionLabel: KERNEL_PERMISSION_LABELS[permission],
  });

  revalidatePath("/dashboard/team");
}
