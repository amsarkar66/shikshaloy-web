import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import PayrollClient from "./_components/PayrollClient";
import type { PayrollStaff, PayrollRecord } from "./_data/payroll";
import type { SchoolOption } from "./_components/PayrollClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and payroll staff can view payroll.</p>
      </div>
    </div>
  );
}

function mapRecords(recordRows: { staff_id: string; month_str: string; basic: number | null; hra: number | null; da: number | null; ta: number | null; other_allowances: number | null; pf_deduction: number | null; tds_deduction: number | null; prof_tax: number | null; gross: number | null; net: number | null; status: string | null; slip_no: string | null; paid_on: string | null; pay_mode: string | null }[]): PayrollRecord[] {
  return recordRows.map((r) => ({
    staffId: r.staff_id,
    monthStr: r.month_str,
    basic: Number(r.basic ?? 0),
    hra: Number(r.hra ?? 0),
    da: Number(r.da ?? 0),
    ta: Number(r.ta ?? 0),
    otherAllowances: Number(r.other_allowances ?? 0),
    pfDeduction: Number(r.pf_deduction ?? 0),
    tdsDeduction: Number(r.tds_deduction ?? 0),
    profTax: Number(r.prof_tax ?? 0),
    gross: Number(r.gross ?? 0),
    net: Number(r.net ?? 0),
    status: (r.status ?? "pending") as PayrollRecord["status"],
    slipNo: r.slip_no,
    paidOn: r.paid_on,
    payMode: r.pay_mode as PayrollRecord["payMode"],
  }));
}

export default async function PayrollPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["accountant", "hr_manager"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();
  const isSuperAdmin = verifiedUser?.role === "super_admin";

  if (isSuperAdmin) {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const { data: schoolRows } = await supabaseAdmin
      .from("schools")
      .select("id, name")
      .eq("institution_id", institutionId)
      .order("name");

    const schools: SchoolOption[] = (schoolRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <PayrollClient staff={[]} records={[]} schools={[]} />;
    }

    const [{ data: staffRows }, { data: recordRows }] = await Promise.all([
      supabaseAdmin
        .from("staff_members")
        .select("id, employee_id, full_name, designation, department, type, status, school_id")
        .in("school_id", schoolIds)
        .order("full_name"),
      supabaseAdmin
        .from("payroll_records")
        .select("staff_id, month_str, basic, hra, da, ta, other_allowances, pf_deduction, tds_deduction, prof_tax, gross, net, status, slip_no, paid_on, pay_mode")
        .in("school_id", schoolIds)
        .order("month_str"),
    ]);

    const staff: PayrollStaff[] = (staffRows ?? []).map((s) => ({
      id: s.id,
      name: s.full_name ?? "",
      employeeId: s.employee_id ?? "",
      designation: s.designation ?? "",
      department: s.department ?? "",
      type: (s.type ?? "teaching") as PayrollStaff["type"],
      status: s.status ?? "active",
      schoolId: s.school_id,
      schoolName: schoolNameById.get(s.school_id) ?? "—",
    }));

    return <PayrollClient staff={staff} records={mapRecords(recordRows ?? [])} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data: staffRows }, { data: recordRows }] = await Promise.all([
    supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, designation, department, type, status")
      .eq("school_id", schoolId)
      .order("full_name"),

    supabaseAdmin
      .from("payroll_records")
      .select("staff_id, month_str, basic, hra, da, ta, other_allowances, pf_deduction, tds_deduction, prof_tax, gross, net, status, slip_no, paid_on, pay_mode")
      .eq("school_id", schoolId)
      .order("month_str"),
  ]);

  const staff: PayrollStaff[] = (staffRows ?? []).map((s) => ({
    id: s.id,
    name: s.full_name ?? "",
    employeeId: s.employee_id ?? "",
    designation: s.designation ?? "",
    department: s.department ?? "",
    type: (s.type ?? "teaching") as PayrollStaff["type"],
    status: s.status ?? "active",
  }));

  return <PayrollClient staff={staff} records={mapRecords(recordRows ?? [])} />;
}
