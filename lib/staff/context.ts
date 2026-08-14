import { supabaseAdmin } from "@/lib/supabase/service";

export interface StaffContext {
  id: string;
  staffId: string;
  schoolId: string;
  fullName: string;
  designation: string;
  department: string;
  employeeId: string;
  permissionTemplateId: string | null;
  permissionTemplateName: string | null;
}

export async function getStaffContext(profileId: string): Promise<StaffContext | null> {
  const { data } = await supabaseAdmin
    .from("staff_members")
    .select("id, school_id, full_name, designation, department, employee_id, permission_template_id, permission_template_name")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: profileId,
    staffId: data.id,
    schoolId: data.school_id,
    fullName: data.full_name,
    designation: data.designation ?? "",
    department: data.department ?? "",
    employeeId: data.employee_id ?? "",
    permissionTemplateId: data.permission_template_id,
    permissionTemplateName: data.permission_template_name,
  };
}
