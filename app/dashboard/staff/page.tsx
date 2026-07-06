import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import StaffClient from "./_components/StaffClient";
import type { StaffMember } from "./_components/StaffClient";

export default async function StaffPage() {
  const { data } = await supabaseAdmin
    .from("staff_members")
    .select("id, employee_id, full_name, phone, email, type, designation, department, joined_date, status, permission_template_id, permission_template_name")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("full_name");

  const staff: StaffMember[] = (data ?? []).map((s: any) => ({
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

  return <StaffClient initialStaff={staff} />;
}
