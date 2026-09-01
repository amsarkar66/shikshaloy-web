import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
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

export default async function StaffPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["hr_manager"]);
  } catch {
    return <Unauthorized />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data }, templates] = await Promise.all([
    supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, phone, email, type, designation, department, joined_date, status, permission_template_id, permission_template_name")
      .eq("school_id", schoolId)
      .order("full_name"),
    getOrSeedRoleTemplates(schoolId),
  ]);

  const permissionTemplates = templates.map((t) => ({ id: t.slug, name: t.name }));

  const staff: StaffMember[] = (data ?? []).map((s) => ({
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
  }));

  return <StaffClient initialStaff={staff} permissionTemplates={permissionTemplates} />;
}
