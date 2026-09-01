import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { KERNEL_PERMISSIONS, type KernelPermission } from "@/lib/kernel-permissions";

export interface VerifiedProfile {
  id: string;
  role: string;
  schoolId: string | null;
  kernelPermission: KernelPermission | null;
}

// Most authorization checks in this codebase used to read
// `user.user_metadata.role` (and `.kernel_permission`) off the JWT — but
// user_metadata is editable by the signed-in user themselves via
// `supabase.auth.updateUser({ data: {...} })`, so it must never be trusted
// for authorization. This resolves the caller's identity from `profiles`
// instead, which is only ever written server-side (and is itself protected
// from self-editing by the trigger in
// 20260901000000_fix_profiles_self_escalation.sql).
//
// Cached per request, same pattern as getUser() in lib/supabase/server.ts.
export const getVerifiedUser = cache(async (): Promise<VerifiedProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, school_id, kernel_permission")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const kernelPermission = (KERNEL_PERMISSIONS as readonly string[]).includes(profile.kernel_permission ?? "")
    ? (profile.kernel_permission as KernelPermission)
    : null;

  return { id: user.id, role: profile.role, schoolId: profile.school_id, kernelPermission };
});

export async function getVerifiedRole(): Promise<string | null> {
  const vu = await getVerifiedUser();
  return vu?.role ?? null;
}

export async function requireRole<T extends string>(allowed: readonly T[]): Promise<{ id: string; role: T }> {
  const vu = await getVerifiedUser();
  if (!vu || !allowed.includes(vu.role as T)) throw new Error("Unauthorized");
  return { id: vu.id, role: vu.role as T };
}

// Same as requireRole, but also admits a "staff" account whose
// staff_members.permission_template_id (server-controlled, set only via
// staff/actions.ts) is one of `staffTemplates` — e.g. a receptionist for
// admissions, an accountant for fees/payroll.
export async function requireRoleOrStaffTemplate(
  roles: readonly string[],
  staffTemplates: readonly string[]
): Promise<{ id: string; role: string }> {
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");

  if (roles.includes(vu.role)) return { id: vu.id, role: vu.role };

  if (vu.role === "staff" && staffTemplates.length > 0) {
    const { data: staff } = await supabaseAdmin
      .from("staff_members")
      .select("permission_template_id")
      .eq("profile_id", vu.id)
      .maybeSingle();
    if (staff?.permission_template_id && staffTemplates.includes(staff.permission_template_id)) {
      return { id: vu.id, role: vu.role };
    }
  }

  throw new Error("Unauthorized");
}

// Platform-team ("kernel") accounts have an owner/admin/viewer tier
// (lib/kernel-permissions.ts). Accounts created before tiers existed have
// no stored kernel_permission — grandfather them in as "owner", matching
// the pre-existing behavior of the (now-removed) per-file requireKernel()
// helpers this replaces.
export async function requireKernel(): Promise<{ id: string; permission: KernelPermission }> {
  const vu = await getVerifiedUser();
  if (!vu || vu.role !== "kernel") throw new Error("Unauthorized");
  return { id: vu.id, permission: vu.kernelPermission ?? "owner" };
}

export async function requireKernelOwner(): Promise<{ id: string }> {
  const { id, permission } = await requireKernel();
  if (permission !== "owner") throw new Error("Only Owners can perform this action");
  return { id };
}
