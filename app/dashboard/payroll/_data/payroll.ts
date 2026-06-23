import {
  ALL_STAFF, avatarColor, initials, deptColor, buildSalary,
  type StaffMember, type StaffType,
} from "../../staff/_data/staff";

export type PayrollStatus = "processed" | "pending" | "on_hold";
export type PayMode       = "bank_transfer" | "cheque";

export interface PayrollRecord {
  staffId:    number;
  monthStr:   string;
  gross:      number;
  net:        number;
  deductions: number;
  status:     PayrollStatus;
  slipNo?:    string;
  paidOn?:    string;
  payMode?:   PayMode;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function monthHash(monthStr: string): number {
  return monthStr.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

function slipNo(staff: StaffMember, monthStr: string): string {
  return `SLP-${monthStr.replace("-", "")}-${staff.employeeId}`;
}

const PAY_MODES: PayMode[] = ["bank_transfer", "bank_transfer", "bank_transfer", "cheque"];

// ── Record generation ─────────────────────────────────────────────────────────

export const CURRENT_MONTH  = "2026-06";
export const PAYROLL_START  = "2026-04";
export const TERM_MONTHS    = ["2026-04", "2026-05", "2026-06"];

function payrollStatus(staff: StaffMember, monthStr: string): PayrollStatus {
  if (staff.status === "inactive" || staff.status === "on_leave") return "on_hold";
  const rng = lcg(staff.id * 61 + monthHash(monthStr) * 17);
  if (monthStr === CURRENT_MONTH) return rng < 0.60 ? "processed" : "pending";
  return rng < 0.93 ? "processed" : "pending";
}

export function getStaffMonthRecord(staff: StaffMember, monthStr: string): PayrollRecord {
  const { gross, net, totalDeductions } = buildSalary(staff);
  const status = payrollStatus(staff, monthStr);

  const payDay = 26 + Math.floor(lcg(staff.id * 37 + monthHash(monthStr) * 11) * 3);

  return {
    staffId:    staff.id,
    monthStr,
    gross,
    net,
    deductions: totalDeductions,
    status,
    slipNo:  status === "processed" ? slipNo(staff, monthStr)  : undefined,
    paidOn:  status === "processed" ? `${monthStr}-${payDay}`  : undefined,
    payMode: status === "processed" ? PAY_MODES[staff.id % PAY_MODES.length] : undefined,
  };
}

export function getSchoolPayrollStats(monthStr: string) {
  const active = ALL_STAFF.filter((s) => s.status !== "inactive");
  const records = active.map((s) => ({
    staff: s,
    record: getStaffMonthRecord(s, monthStr),
    salary: buildSalary(s),
  }));

  const totalPayroll  = records.reduce((a, r) => a + r.salary.gross, 0);
  const processed     = records.filter((r) => r.record.status === "processed");
  const pending       = records.filter((r) => r.record.status === "pending");
  const onHold        = records.filter((r) => r.record.status === "on_hold");
  const totalPaid     = processed.reduce((a, r) => a + r.salary.net, 0);

  return {
    totalPayroll,
    totalPaid,
    processedN: processed.length,
    pendingN:   pending.length,
    onHoldN:    onHold.length,
    totalStaff: active.length,
  };
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<PayrollStatus, string> = {
  processed: "Processed",
  pending:   "Pending",
  on_hold:   "On Hold",
};

export const STATUS_BADGE: Record<PayrollStatus, string> = {
  processed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending:   "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  on_hold:   "bg-zinc-500/10    text-zinc-600    dark:text-zinc-400    border-zinc-500/20",
};

export function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function addMonths(monthStr: string, n: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export { ALL_STAFF, avatarColor, initials, deptColor, buildSalary };
export type { StaffMember, StaffType };
