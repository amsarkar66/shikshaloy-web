import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import { getOrSeedRoleTemplates } from "@/lib/settings/role-templates";
import StaffClient from "./_components/StaffClient";
import type { StaffMember } from "./_components/StaffClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and institution owners can view staff records.</p>
      </div>
    </div>
  );
}

interface StaffRow {
  id: string;
  employee_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: string | null;
  designation: string | null;
  department: string | null;
  joined_date: string | null;
  status: string | null;
  permission_template_id: string | null;
  permission_template_name: string | null;
  school_id: string;
}

function toStaffMember(s: StaffRow, schoolNameById?: Map<string, string>): StaffMember {
  return {
    id: s.id,
    employeeId: s.employee_id ?? "",
    name: s.full_name,
    phone: s.phone ?? "",
    email: s.email ?? "",
    type: (s.type ?? "teaching") as StaffMember["type"],
    designation: s.designation ?? "",
    department: s.department ?? "",
    joinedDate: s.joined_date ?? "",
    status: (s.status ?? "active") as StaffMember["status"],
    permissionTemplateId: s.permission_template_id ?? undefined,
    permissionTemplateName: s.permission_template_name ?? undefined,
    schoolId: schoolNameById ? s.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(s.school_id) ?? "—") : undefined,
  };
}

export default async function StaffPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["hr_manager"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();

  if (verifiedUser?.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <StaffClient initialStaff={[]} permissionTemplates={[]} schools={schools} />;
    }

    const { data } = await supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, phone, email, type, designation, department, joined_date, status, permission_template_id, permission_template_name, school_id")
      .in("school_id", schoolIds)
      .order("full_name");

    const staff: StaffMember[] = ((data ?? []) as unknown as StaffRow[]).map((s) => toStaffMember(s, schoolNameById));

    // Permission templates are per-school; the invite modal loads them on
    // demand once a school is picked (getStaffTemplatesForSchool), so no
    // template list needs to be prefetched here.
    return <StaffClient initialStaff={staff} permissionTemplates={[]} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data }, templates] = await Promise.all([
    supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, phone, email, type, designation, department, joined_date, status, permission_template_id, permission_template_name, school_id")
      .eq("school_id", schoolId)
      .order("full_name"),
    getOrSeedRoleTemplates(schoolId),
  ]);

  const permissionTemplates = templates.map((t) => ({ id: t.slug, name: t.name }));

  const staff: StaffMember[] = ((data ?? []) as unknown as StaffRow[]).map((s) => toStaffMember(s));

  return <StaffClient initialStaff={staff} permissionTemplates={permissionTemplates} />;
}
