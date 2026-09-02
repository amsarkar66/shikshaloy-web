export type PayrollStatus = "processed" | "pending" | "on_hold";
export type PayMode       = "bank_transfer" | "cheque";
export type StaffType     = "teaching" | "non_teaching";

export interface PayrollStaff {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  type: StaffType;
  status: string;
  schoolId?: string;
  schoolName?: string;
}

export interface PayrollRecord {
  staffId: string;
  monthStr: string;
  basic: number;
  hra: number;
  da: number;
  ta: number;
  otherAllowances: number;
  pfDeduction: number;
  tdsDeduction: number;
  profTax: number;
  gross: number;
  net: number;
  status: PayrollStatus;
  slipNo: string | null;
  paidOn: string | null;
  payMode: PayMode | null;
}

export function earningsOf(r: PayrollRecord) {
  return [
    { label: "Basic",             amount: r.basic },
    { label: "HRA",               amount: r.hra },
    { label: "DA",                amount: r.da },
    { label: "TA",                amount: r.ta },
    { label: "Other Allowances",  amount: r.otherAllowances },
  ];
}

export function deductionsOf(r: PayrollRecord) {
  return [
    { label: "Provident Fund",    amount: r.pfDeduction },
    { label: "TDS",               amount: r.tdsDeduction },
    { label: "Professional Tax",  amount: r.profTax },
  ];
}

export function totalDeductions(r: PayrollRecord): number {
  return r.pfDeduction + r.tdsDeduction + r.profTax;
}

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

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

export function avatarColor(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const DEPT_BADGE_COLORS = [
  "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
];

export function deptColor(dept: string): string {
  const n = dept.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return DEPT_BADGE_COLORS[n % DEPT_BADGE_COLORS.length];
}
