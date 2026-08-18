"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId, getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { updateStaffType } from "@/lib/supabase/admin";
import { BUILTIN_DEFAULTS, type ModulePerms } from "@/lib/settings/role-template-constants";
import { logAuditEvent } from "@/lib/audit/log";

export async function assignStaffTemplate(
  userId: string,
  staffType: string,
  staffTemplateId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  const ok = await updateStaffType(userId, staffType, staffTemplateId);
  if (!ok) throw new Error("Failed to update staff type");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("full_name")
    .eq("profile_id", userId)
    .maybeSingle();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Staff",
    description: `Changed staff type for ${staff?.full_name ?? "a staff member"} to '${staffType}'`,
  });

  revalidatePath("/dashboard/settings");
}

// ── School Profile ────────────────────────────────────────────────────────────

export interface UpdateSchoolProfileInput {
  name: string;
  tagline: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  board: string | null;
  logoUrl: string | null;
  currentAcademicYearId: string | null;
}

export async function updateSchoolProfile(input: UpdateSchoolProfileInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("schools")
    .update({
      name: input.name,
      tagline: input.tagline || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      board: input.board || null,
      logo_url: input.logoUrl || null,
    })
    .eq("id", schoolId);

  if (error) throw new Error(`Failed to update school profile: ${error.message}`);

  if (input.currentAcademicYearId) {
    await supabaseAdmin.from("academic_years").update({ is_current: false }).eq("school_id", schoolId);
    const { error: ayError } = await supabaseAdmin
      .from("academic_years")
      .update({ is_current: true })
      .eq("id", input.currentAcademicYearId)
      .eq("school_id", schoolId);
    if (ayError) throw new Error(`Failed to set current academic year: ${ayError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Settings",
    description: `Updated school profile settings`,
  });

  revalidatePath("/dashboard/settings");
}

// ── Academic settings ─────────────────────────────────────────────────────────

export interface UpdateAcademicSettingsInput {
  workingDays: string[];
  periodsPerDay: number;
  periodDurationMins: number;
  attendanceThreshold: number;
  gradingScale: string;
  passMarks: number;
}

export async function updateAcademicSettings(input: UpdateAcademicSettingsInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("school_academic_settings")
    .upsert({
      school_id: schoolId,
      working_days: input.workingDays,
      periods_per_day: input.periodsPerDay,
      period_duration_mins: input.periodDurationMins,
      attendance_threshold: input.attendanceThreshold,
      grading_scale: input.gradingScale,
      pass_marks: input.passMarks,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(`Failed to update academic settings: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Settings",
    description: `Updated academic settings`,
  });

  revalidatePath("/dashboard/settings");
}

// ── Role templates / permissions ──────────────────────────────────────────────

export interface SaveRoleTemplateInput {
  id: string;
  name: string;
  description: string;
  permissions: ModulePerms;
}

export async function saveRoleTemplate(input: SaveRoleTemplateInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("role_templates")
    .update({
      name: input.name,
      description: input.description,
      permissions: input.permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) throw new Error(`Failed to save role template: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Settings",
    description: `Updated role template '${input.name}'`,
  });

  revalidatePath("/dashboard/settings");
}

export async function createRoleTemplate(): Promise<{ id: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("role_templates")
    .insert({
      school_id: schoolId,
      slug: `custom_${crypto.randomUUID()}`,
      name: "New Role",
      description: "",
      is_builtin: false,
      permissions: {},
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to create role template: ${error?.message}`);

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Settings",
    description: `Created new role template`,
  });

  revalidatePath("/dashboard/settings");
  return { id: data.id };
}

export async function deleteRoleTemplate(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: template, error } = await supabaseAdmin
    .from("role_templates")
    .delete()
    .eq("id", id)
    .eq("is_builtin", false)
    .select("name")
    .single();

  if (error) throw new Error(`Failed to delete role template: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "delete",
    module: "Settings",
    description: `Deleted role template '${template?.name ?? id}'`,
  });

  revalidatePath("/dashboard/settings");
}

export async function restoreRoleTemplateDefaults(id: string, slug: string): Promise<ModulePerms> {
  const permissions = BUILTIN_DEFAULTS[slug];
  if (!permissions) throw new Error("Not a built-in template");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: template, error } = await supabaseAdmin
    .from("role_templates")
    .update({ permissions, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_builtin", true)
    .select("name")
    .single();

  if (error) throw new Error(`Failed to restore defaults: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Settings",
    description: `Restored default permissions for role template '${template?.name ?? slug}'`,
  });

  revalidatePath("/dashboard/settings");
  return permissions;
}

// ── Notification preferences ──────────────────────────────────────────────────

export async function updateNotificationPreferences(
  profileId: string,
  prefs: Record<string, Record<string, boolean>>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert({ profile_id: profileId, prefs, updated_at: new Date().toISOString() });

  if (error) throw new Error(`Failed to update notification preferences: ${error.message}`);

  revalidatePath("/dashboard/settings");
}

// ── Account ────────────────────────────────────────────────────────────────────

export interface UpdateProfileBasicInput {
  profileId: string;
  fullName: string;
  phone: string | null;
}

export async function updateProfileBasic(input: UpdateProfileBasicInput): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: input.fullName, phone: input.phone || null })
    .eq("id", input.profileId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);

  const schoolId = await getCurrentSchoolId();
  if (schoolId) {
    await logAuditEvent({
      schoolId,
      action: "update",
      module: "Settings",
      description: `Updated account profile`,
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) throw new Error("Not authenticated");

  const verifyClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error("Current password is incorrect.");

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) throw new Error(`Failed to update password: ${error.message}`);

  const schoolId = await getCurrentSchoolId();
  if (schoolId) {
    await logAuditEvent({
      schoolId,
      action: "update",
      module: "Settings",
      description: `Changed account password`,
    });
  }
}
