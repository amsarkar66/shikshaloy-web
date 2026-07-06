import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import PayrollClient from "./_components/PayrollClient";
import type { PayrollStaff, PayrollRecord } from "./_data/payroll";

export default async function PayrollPage() {
  const [{ data: staffRows }, { data: recordRows }] = await Promise.all([
    supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, designation, department, type, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("full_name"),

    supabaseAdmin
      .from("payroll_records")
      .select("staff_id, month_str, basic, hra, da, ta, other_allowances, pf_deduction, tds_deduction, prof_tax, gross, net, status, slip_no, paid_on, pay_mode")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("month_str"),
  ]);

  const staff: PayrollStaff[] = (staffRows ?? []).map((s: any) => ({
    id: s.id,
    name: s.full_name ?? "",
    employeeId: s.employee_id ?? "",
    designation: s.designation ?? "",
    department: s.department ?? "",
    type: (s.type ?? "teaching") as PayrollStaff["type"],
    status: s.status ?? "active",
  }));

  const records: PayrollRecord[] = (recordRows ?? []).map((r: any) => ({
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
    status: r.status ?? "pending",
    slipNo: r.slip_no,
    paidOn: r.paid_on,
    payMode: r.pay_mode,
  }));

  return <PayrollClient staff={staff} records={records} />;
}
