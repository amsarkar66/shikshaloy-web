import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import StaffDetailClient, {
  type StaffDetail, type StaffLeave, type StaffAttendanceSummary,
} from "./_components/StaffDetailClient";
import type { PayrollRecord } from "../../payroll/_data/payroll";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function yearsOfService(joinedDate: string | null): string {
  if (!joinedDate) return "—";
  const joined = new Date(joinedDate);
  const now    = new Date();
  let years  = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years <= 0) return `${Math.max(months, 0)}m`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months}m`;
}

interface StaffDetailRow {
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
  blood_group: string | null;
  photo_url: string | null;
  bio: string | null;
  permission_template_name: string | null;
}

interface StaffAttendanceRow {
  date: string;
  status: string;
}

interface StaffLeaveRow {
  id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  approver: { full_name: string | null } | null;
}

interface StaffPayrollRow {
  month_str: string;
  basic: number | null;
  hra: number | null;
  da: number | null;
  ta: number | null;
  other_allowances: number | null;
  pf_deduction: number | null;
  tds_deduction: number | null;
  prof_tax: number | null;
  gross: number | null;
  net: number | null;
  status: string | null;
  slip_no: string | null;
  paid_on: string | null;
  pay_mode: string | null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [
    { data: staffRow },
    { data: attRows },
    { data: leaveRows },
    { data: payrollRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("staff_members")
      .select("id, employee_id, full_name, phone, email, type, designation, department, joined_date, status, blood_group, photo_url, bio, permission_template_name")
      .eq("school_id", schoolId)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("staff_attendance")
      .select("date, status")
      .eq("school_id", schoolId)
      .eq("staff_id", id)
      .order("date"),

    supabaseAdmin
      .from("leave_requests")
      .select(`
        id, leave_type, from_date, to_date, days, reason, status, applied_on,
        approver:staff_members!leave_requests_approved_by_fkey ( full_name )
      `)
      .eq("staff_id", id)
      .order("applied_on", { ascending: false })
      .limit(8),

    supabaseAdmin
      .from("payroll_records")
      .select("month_str, basic, hra, da, ta, other_allowances, pf_deduction, tds_deduction, prof_tax, gross, net, status, slip_no, paid_on, pay_mode")
      .eq("school_id", schoolId)
      .eq("staff_id", id)
      .order("month_str", { ascending: false }),
  ]);

  if (!staffRow) notFound();

  const s = staffRow as unknown as StaffDetailRow;
  const staff: StaffDetail = {
    id: s.id,
    name: s.full_name,
    employeeId: s.employee_id ?? "—",
    phone: s.phone ?? "—",
    email: s.email ?? "—",
    type: (s.type ?? "teaching") as "teaching" | "non_teaching",
    designation: s.designation ?? "—",
    department: s.department ?? "—",
    joinedDate: formatDate(s.joined_date),
    status: s.status ?? "active",
    bloodGroup: s.blood_group ?? "—",
    photoUrl: s.photo_url ?? null,
    bio: s.bio,
    permissionTemplateName: s.permission_template_name,
    yearsOfService: yearsOfService(s.joined_date),
  };

  // ── Attendance, grouped by month ──────────────────────────────────────────
  const attByMonth = new Map<string, { present: number; total: number }>();
  for (const r of (attRows ?? []) as unknown as StaffAttendanceRow[]) {
    const label = monthLabel(r.date);
    const entry = attByMonth.get(label) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (r.status === "present" || r.status === "late") entry.present += 1;
    attByMonth.set(label, entry);
  }
  const monthly = Array.from(attByMonth.entries()).map(([month, v]) => ({ month, ...v }));
  const totalPresent = monthly.reduce((sum, m) => sum + m.present, 0);
  const totalDays    = monthly.reduce((sum, m) => sum + m.total, 0);
  const attendance: StaffAttendanceSummary = {
    monthly,
    overallPct: totalDays ? Math.round((totalPresent / totalDays) * 100) : 0,
    totalPresent,
    totalDays,
  };

  // ── Leaves ────────────────────────────────────────────────────────────────
  const leaves: StaffLeave[] = ((leaveRows ?? []) as unknown as StaffLeaveRow[]).map((l) => ({
    id: l.id,
    leaveType: l.leave_type,
    from: formatDate(l.from_date),
    to: formatDate(l.to_date),
    days: l.days ?? 1,
    reason: l.reason ?? "—",
    status: (l.status ?? "pending") as StaffLeave["status"],
    appliedOn: formatDate(l.applied_on),
    approvedBy: l.approver?.full_name ?? undefined,
  }));

  // ── Payroll ───────────────────────────────────────────────────────────────
  const payroll: PayrollRecord[] = ((payrollRows ?? []) as unknown as StaffPayrollRow[]).map((r) => ({
    staffId: staff.id,
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

  return <StaffDetailClient staff={staff} attendance={attendance} leaves={leaves} payroll={payroll} />;
}
