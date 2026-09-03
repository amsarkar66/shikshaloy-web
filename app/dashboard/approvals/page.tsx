import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import ApprovalsClient, {
  type SchoolOption, type AdmissionApprovalRow,
  type ExpenseApprovalRow, type PayrollApprovalGroup,
} from "./_components/ApprovalsClient";
import type { Leave } from "./_components/LeaveRequestsPanel";
import type { LeaveType, LeaveStatus } from "../leaves/_data/leaves";

export const dynamic = "force-dynamic";

interface StaffLeaveRow {
  id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  school_id: string;
  staff_members: { full_name: string | null; designation: string | null; department: string | null } | null;
  approver: { full_name: string | null } | null;
}

interface StudentLeaveRow {
  id: string;
  student_id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  school_id: string;
  students: { full_name: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
  approver: { full_name: string | null } | null;
}

interface AdmissionRow {
  id: string;
  applicant_name: string;
  applying_for_grade: string | null;
  parent_name: string | null;
  submitted_date: string | null;
  school_id: string;
}

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  vendor: string | null;
  amount: number;
  date: string;
  school_id: string;
}

interface PayrollRow {
  school_id: string;
  month_str: string;
  net: number | null;
}

export default async function ApprovalsPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");
  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const schools: SchoolOption[] = await getInstitutionSchools(institutionId);
  const schoolIds = schools.map((s) => s.id);
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

  if (schoolIds.length === 0) {
    return <ApprovalsClient schools={schools} leaves={[]} admissions={[]} expenses={[]} payroll={[]} />;
  }

  const [
    { data: staffLeaveRows }, { data: studentLeaveRows },
    { data: admissionRows }, { data: expenseRows }, { data: payrollRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("leave_requests")
      .select(`
        id, leave_type, from_date, to_date, days, reason, status, applied_on, school_id,
        staff_members!leave_requests_staff_id_fkey ( full_name, designation, department ),
        approver:staff_members!leave_requests_approved_by_fkey ( full_name )
      `)
      .in("school_id", schoolIds)
      .order("applied_on", { ascending: false }),
    supabaseAdmin
      .from("student_leave_requests")
      .select(`
        id, student_id, leave_type, from_date, to_date, days, reason, status, applied_on, school_id,
        students ( full_name, sections ( name, grades ( level ) ) ),
        approver:staff_members!student_leave_requests_approved_by_fkey ( full_name )
      `)
      .in("school_id", schoolIds)
      .order("applied_on", { ascending: false }),
    supabaseAdmin
      .from("admission_applications")
      .select("id, applicant_name, applying_for_grade, parent_name, submitted_date, school_id")
      .in("school_id", schoolIds)
      .eq("status", "pending")
      .order("submitted_date", { ascending: true }),
    supabaseAdmin
      .from("expenses")
      .select("id, category, description, vendor, amount, date, school_id")
      .in("school_id", schoolIds)
      .eq("status", "pending")
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("payroll_records")
      .select("school_id, month_str, net")
      .in("school_id", schoolIds)
      .eq("status", "pending"),
  ]);

  const staffLeaves: Leave[] = ((staffLeaveRows ?? []) as unknown as StaffLeaveRow[]).map((l) => ({
    id: l.id,
    personType: "staff",
    staffName: l.staff_members?.full_name ?? "Unknown",
    role: l.staff_members?.designation ?? "",
    department: l.staff_members?.department ?? "",
    leaveType: l.leave_type as LeaveType,
    from: l.from_date ?? "",
    to: l.to_date ?? "",
    days: l.days ?? 1,
    reason: l.reason ?? "",
    status: (l.status ?? "pending") as LeaveStatus,
    appliedOn: l.applied_on ?? "",
    approvedBy: l.approver?.full_name ?? undefined,
    schoolId: l.school_id,
    schoolName: schoolNameById.get(l.school_id) ?? "—",
  }));

  const studentLeaves: Leave[] = ((studentLeaveRows ?? []) as unknown as StudentLeaveRow[]).map((l) => {
    const section = l.students?.sections;
    const classLabel = section ? `${section.grades?.level ?? "—"}-${section.name ?? ""}` : "";
    return {
      id: l.id,
      personType: "student",
      studentId: l.student_id,
      staffName: l.students?.full_name ?? "Unknown",
      role: "Student",
      department: classLabel,
      leaveType: l.leave_type as LeaveType,
      from: l.from_date ?? "",
      to: l.to_date ?? "",
      days: l.days ?? 1,
      reason: l.reason ?? "",
      status: (l.status ?? "pending") as LeaveStatus,
      appliedOn: l.applied_on ?? "",
      approvedBy: l.approver?.full_name ?? undefined,
      schoolId: l.school_id,
      schoolName: schoolNameById.get(l.school_id) ?? "—",
    };
  });

  const leaves = [...staffLeaves, ...studentLeaves].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));

  const admissions: AdmissionApprovalRow[] = ((admissionRows ?? []) as unknown as AdmissionRow[]).map((a) => ({
    id: a.id,
    applicantName: a.applicant_name,
    grade: a.applying_for_grade ?? "—",
    parentName: a.parent_name,
    submittedDate: a.submitted_date,
    schoolId: a.school_id,
    schoolName: schoolNameById.get(a.school_id) ?? "—",
  }));

  const expenses: ExpenseApprovalRow[] = ((expenseRows ?? []) as unknown as ExpenseRow[]).map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    vendor: e.vendor,
    amount: Number(e.amount),
    date: e.date,
    schoolId: e.school_id,
    schoolName: schoolNameById.get(e.school_id) ?? "—",
  }));

  const payrollGroupMap = new Map<string, PayrollApprovalGroup>();
  for (const r of (payrollRows ?? []) as unknown as PayrollRow[]) {
    const key = `${r.school_id}:${r.month_str}`;
    const existing = payrollGroupMap.get(key);
    if (existing) {
      existing.pendingCount += 1;
      existing.totalNet += Number(r.net ?? 0);
    } else {
      payrollGroupMap.set(key, {
        schoolId: r.school_id,
        schoolName: schoolNameById.get(r.school_id) ?? "—",
        monthStr: r.month_str,
        pendingCount: 1,
        totalNet: Number(r.net ?? 0),
      });
    }
  }
  const payroll = Array.from(payrollGroupMap.values()).sort((a, b) => a.monthStr.localeCompare(b.monthStr));

  return (
    <ApprovalsClient
      schools={schools}
      leaves={leaves}
      admissions={admissions}
      expenses={expenses}
      payroll={payroll}
    />
  );
}
