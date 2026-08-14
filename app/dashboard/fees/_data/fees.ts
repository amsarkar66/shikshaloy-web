export type PaymentStatus = "paid" | "partial" | "overdue";
export type PaymentMode   = "online" | "cash" | "cheque" | "upi";

export interface FeeStudent {
  id: string;
  name: string;
  rollNo: string;
  classNum: string;
  section: string;
  parent: string;
  phone: string;
  active: boolean;
}

export interface FeePaymentRow {
  id: string;
  studentId: string;
  monthStr: string;
  category: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  paidDate: string | null;
  receiptNo: string | null;
  paymentMode: PaymentMode | null;
}

export interface GradeOption {
  id: string;
  level: number;
}

export interface FeeStructure {
  id: string;
  gradeId: string | null; // null = all grades
  gradeLevel: number | null;
  category: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annual";
  isOptional: boolean;
}

export interface MonthlyFeeRecord {
  studentId: string;
  monthStr: string;
  lineItems: { category: string; amount: number; paid: number }[];
  totalDue: number;
  totalPaid: number;
  balance: number;
  status: PaymentStatus;
  paidDate?: string;
  receiptNo?: string;
  payMode?: PaymentMode;
}

export function buildMonthlyRecord(studentId: string, monthStr: string, rows: FeePaymentRow[]): MonthlyFeeRecord {
  const lineItems = rows.map((r) => ({ category: r.category, amount: r.amountDue, paid: r.amountPaid }));
  const totalDue = lineItems.reduce((s, i) => s + i.amount, 0);
  const totalPaid = lineItems.reduce((s, i) => s + i.paid, 0);
  const balance = totalDue - totalPaid;
  const status: PaymentStatus = totalDue === 0 ? "overdue" : totalPaid >= totalDue ? "paid" : totalPaid > 0 ? "partial" : "overdue";
  const withDate = rows.find((r) => r.paidDate);
  const withReceipt = rows.find((r) => r.receiptNo);
  const withMode = rows.find((r) => r.paymentMode);
  return {
    studentId,
    monthStr,
    lineItems,
    totalDue,
    totalPaid,
    balance,
    status,
    paidDate: withDate?.paidDate ?? undefined,
    receiptNo: withReceipt?.receiptNo ?? undefined,
    payMode: withMode?.paymentMode ?? undefined,
  };
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  paid:    "Paid",
  partial: "Partial",
  overdue: "Overdue",
};

export const STATUS_BADGE: Record<PaymentStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
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

export const CLASS_NUMBERS = ["5", "6", "7", "8", "9", "10"];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

export function avatarColor(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
