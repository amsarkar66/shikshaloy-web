import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getOrSeedRoleTemplates } from "@/lib/settings/role-templates";
import StaffClient from "./_components/StaffClient";
import type { StaffMember } from "./_components/StaffClient";

export default async function StaffPage() {
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
