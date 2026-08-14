import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getOrSeedRoleTemplates } from "@/lib/settings/role-templates";
import { listPublishKeys } from "@/lib/publish-keys/actions";
import { listSchoolBanners } from "@/lib/schools/banner-actions";
import { SettingsPageClient, type SettingsData } from "./_components/settings-client";

export default async function SettingsPage() {
  const {
    data: { user },
  } = await getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "";

  const { data: profileRow } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: notifRow } = await supabaseAdmin
    .from("notification_preferences")
    .select("prefs")
    .eq("profile_id", user.id)
    .maybeSingle();

  const needsSchoolData = role === "admin";
  const needsTemplates = role === "admin" || role === "super_admin";
  const needsPublishKeys = role === "super_admin" || role === "kernel";

  // kernel operates platform-wide and has no associated school, so only
  // resolve (and require) a school id for roles whose data actually needs one.
  const schoolId = needsSchoolData || needsTemplates ? await getCurrentSchoolIdOrThrow() : "";

  const [schoolResult, academicYearsResult, academicSettingsResult, templates, publishKeys, banners] = await Promise.all([
    needsSchoolData
      ? supabaseAdmin
          .from("schools")
          .select("id, name, tagline, address, city, state, phone, email, website, board, logo_url")
          .eq("id", schoolId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    needsSchoolData
      ? supabaseAdmin
          .from("academic_years")
          .select("id, name, start_date, is_current")
          .eq("school_id", schoolId)
          .order("start_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    needsSchoolData
      ? supabaseAdmin
          .from("school_academic_settings")
          .select("working_days, periods_per_day, period_duration_mins, attendance_threshold, grading_scale, pass_marks")
          .eq("school_id", schoolId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    needsTemplates ? getOrSeedRoleTemplates(schoolId) : Promise.resolve([]),
    needsPublishKeys ? listPublishKeys() : Promise.resolve([]),
    needsSchoolData ? listSchoolBanners() : Promise.resolve([]),
  ]);

  const data: SettingsData = {
    profile: {
      id: user.id,
      fullName: profileRow?.full_name ?? (user.user_metadata?.full_name as string) ?? "",
      phone: profileRow?.phone ?? "",
      email: user.email ?? "",
    },
    notifPrefs: (notifRow?.prefs as SettingsData["notifPrefs"]) ?? null,
    school: schoolResult.data
      ? {
          name: schoolResult.data.name ?? "",
          tagline: schoolResult.data.tagline ?? "",
          address: schoolResult.data.address ?? "",
          city: schoolResult.data.city ?? "",
          state: schoolResult.data.state ?? "",
          phone: schoolResult.data.phone ?? "",
          email: schoolResult.data.email ?? "",
          website: schoolResult.data.website ?? "",
          board: schoolResult.data.board ?? "",
          logoUrl: schoolResult.data.logo_url ?? null,
        }
      : null,
    academicYears: (academicYearsResult.data ?? []).map((ay) => ({
      id: ay.id,
      name: ay.name,
      startDate: ay.start_date,
      isCurrent: ay.is_current ?? false,
    })),
    academicSettings: academicSettingsResult.data
      ? {
          workingDays: academicSettingsResult.data.working_days ?? [],
          periodsPerDay: academicSettingsResult.data.periods_per_day,
          periodDurationMins: academicSettingsResult.data.period_duration_mins,
          attendanceThreshold: academicSettingsResult.data.attendance_threshold,
          gradingScale: academicSettingsResult.data.grading_scale,
          passMarks: academicSettingsResult.data.pass_marks,
        }
      : null,
    roleTemplates: templates,
    publishKeys,
    banners,
  };

  return <SettingsPageClient role={role} data={data} />;
}
