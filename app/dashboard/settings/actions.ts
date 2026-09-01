"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId, getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { BUILTIN_DEFAULTS, type ModulePerms } from "@/lib/settings/role-template-constants";
import { logAuditEvent } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/verified-role";
import { DEFAULT_REPORT_CARD_SETTINGS, type ReportCardSettings, type ReportCardVisibleFields } from "@/lib/report-cards/templates";

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
  signatureUrl: string | null;
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
      principal_signature_url: input.signatureUrl || null,
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

// ── Grade bands ───────────────────────────────────────────────────────────────

export interface GradeBandRow {
  id: string;
  label: string;
  minPercent: number;
}

export async function listGradeBandsForSchool(): Promise<GradeBandRow[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("grade_bands")
    .select("id, label, min_percent")
    .eq("school_id", schoolId)
    .order("min_percent", { ascending: false });

  return (data ?? []).map((b) => ({ id: b.id, label: b.label, minPercent: Number(b.min_percent) }));
}

export async function createGradeBand(label: string, minPercent: number): Promise<{ id: string }> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Grade label is required.");
  if (!Number.isFinite(minPercent) || minPercent < 0 || minPercent > 100) throw new Error("Minimum % must be between 0 and 100.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data, error } = await supabaseAdmin
    .from("grade_bands")
    .insert({ school_id: schoolId, label: trimmed, min_percent: minPercent })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`A grade named "${trimmed}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
  return { id: data.id };
}

export async function updateGradeBand(id: string, label: string, minPercent: number): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Grade label is required.");
  if (!Number.isFinite(minPercent) || minPercent < 0 || minPercent > 100) throw new Error("Minimum % must be between 0 and 100.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("grade_bands")
    .update({ label: trimmed, min_percent: minPercent })
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`A grade named "${trimmed}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
}

export async function deleteGradeBand(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("grade_bands")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

// ── Report card template ─────────────────────────────────────────────────────

export async function getReportCardSettings(): Promise<ReportCardSettings> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("report_card_settings")
    .select("template_id, visible_fields, footer_note")
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!data) return DEFAULT_REPORT_CARD_SETTINGS;

  return {
    templateId: data.template_id,
    visibleFields: data.visible_fields as ReportCardVisibleFields,
    footerNote: data.footer_note,
  };
}

export async function saveReportCardSettings(settings: ReportCardSettings): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("report_card_settings")
    .upsert({
      school_id: schoolId,
      template_id: settings.templateId,
      visible_fields: settings.visibleFields,
      footer_note: settings.footerNote,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(`Failed to save report card template: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Settings",
    description: `Updated report card template`,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/exams");
}

// ── Role templates / permissions ──────────────────────────────────────────────

export interface SaveRoleTemplateInput {
  id: string;
  name: string;
  description: string;
  permissions: ModulePerms;
}

export async function saveRoleTemplate(input: SaveRoleTemplateInput): Promise<void> {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("role_templates")
    .update({
      name: input.name,
      description: input.description,
      permissions: input.permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

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
  await requireRole(["admin", "super_admin"]);
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
  await requireRole(["admin", "super_admin"]);
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: template, error } = await supabaseAdmin
    .from("role_templates")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId)
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
  await requireRole(["admin", "super_admin"]);
  const permissions = BUILTIN_DEFAULTS[slug];
  if (!permissions) throw new Error("Not a built-in template");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: template, error } = await supabaseAdmin
    .from("role_templates")
    .update({ permissions, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", schoolId)
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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
