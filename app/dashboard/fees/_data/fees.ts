import { ALL_STUDENTS, avatarColor, type Student } from "../../students/_data/students";

export type PaymentStatus = "paid" | "partial" | "overdue";
export type PaymentMode   = "online" | "cash" | "cheque" | "upi";

export interface FeeLineItem {
  category: string;
  amount:   number;
  paid:     number;
}

export interface MonthlyFeeRecord {
  studentId: number;
  monthStr:  string;
  lineItems: FeeLineItem[];
  totalDue:  number;
  totalPaid: number;
  balance:   number;
  status:    PaymentStatus;
  paidDate?: string;
  receiptNo?: string;
  payMode?:  PaymentMode;
}

// ── Fee structure ─────────────────────────────────────────────────────────────

const TUITION: Record<string, number> = {
  "5": 3000, "6": 3000, "7": 3500, "8": 3500, "9": 4000, "10": 4000,
};

function hasTransport(student: Student): boolean {
  return student.id % 3 !== 0;
}

function hasComputer(student: Student): boolean {
  return parseInt(student.class) >= 7;
}

export function getFeeLineItems(student: Student): Array<{ category: string; amount: number }> {
  const items: Array<{ category: string; amount: number }> = [
    { category: "Tuition Fee",  amount: TUITION[student.class] ?? 3000 },
    { category: "Library Fee",  amount: 150 },
    { category: "Activity Fee", amount: 200 },
  ];
  if (hasComputer(student))  items.push({ category: "Computer Lab Fee", amount: 100  });
  if (hasTransport(student)) items.push({ category: "Transport Fee",    amount: 1500 });
  return items;
}

export function getMonthlyDue(student: Student): number {
  return getFeeLineItems(student).reduce((a, b) => a + b.amount, 0);
}

// ── Pseudo-random helpers ─────────────────────────────────────────────────────

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function monthHash(monthStr: string): number {
  return monthStr.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

// ── Record generation ─────────────────────────────────────────────────────────

function paymentStatus(student: Student, monthStr: string): PaymentStatus {
  const rng = lcg(student.id * 71 + monthHash(monthStr) * 13);
  if (student.feeStatus === "paid")    return rng < 0.85 ? "paid"    : "partial";
  if (student.feeStatus === "partial") return rng < 0.55 ? "partial" : rng < 0.85 ? "overdue" : "paid";
  return rng < 0.70 ? "overdue" : "partial";
}

function paidAmount(totalDue: number, status: PaymentStatus, student: Student, monthStr: string): number {
  if (status === "paid")    return totalDue;
  if (status === "overdue") return 0;
  const ratio = 0.30 + lcg(student.id * 43 + monthHash(monthStr) * 19) * 0.50;
  return Math.round(totalDue * ratio / 100) * 100;
}

function receiptNo(studentId: number, monthStr: string): string {
  const n = Math.floor(lcg(studentId * 31 + monthHash(monthStr)) * 9000) + 1000;
  return `RCP-${monthStr.replace("-", "")}-${n}`;
}

const PAY_MODES: PaymentMode[] = ["online", "upi", "online", "cash", "online", "cheque"];

export function getMonthlyFeeRecord(student: Student, monthStr: string): MonthlyFeeRecord {
  const itemDefs  = getFeeLineItems(student);
  const totalDue  = itemDefs.reduce((a, b) => a + b.amount, 0);
  const status    = paymentStatus(student, monthStr);
  const totalPaid = paidAmount(totalDue, status, student, monthStr);
  const balance   = totalDue - totalPaid;

  const seed   = student.id * 53 + monthHash(monthStr);
  const payDay = Math.floor(lcg(seed) * 10) + 1;

  const lineItems: FeeLineItem[] = itemDefs.map((item) => {
    if (status === "paid")    return { ...item, paid: item.amount };
    if (status === "overdue") return { ...item, paid: 0 };
    const r = totalPaid / totalDue;
    return { ...item, paid: Math.round(item.amount * r) };
  });

  return {
    studentId: student.id,
    monthStr,
    lineItems,
    totalDue,
    totalPaid,
    balance,
    status,
    paidDate:  status !== "overdue" ? `${monthStr}-${String(payDay).padStart(2, "0")}` : undefined,
    receiptNo: status === "paid"    ? receiptNo(student.id, monthStr) : undefined,
    payMode:   status !== "overdue" ? PAY_MODES[student.id % PAY_MODES.length] : undefined,
  };
}

export function getSchoolMonthStats(monthStr: string) {
  const students  = ALL_STUDENTS.filter((s) => s.active);
  const records   = students.map((s) => getMonthlyFeeRecord(s, monthStr));
  const totalDue  = records.reduce((a, r) => a + r.totalDue, 0);
  const totalPaid = records.reduce((a, r) => a + r.totalPaid, 0);
  const overdueN  = records.filter((r) => r.status === "overdue").length;
  const paidN     = records.filter((r) => r.status === "paid").length;
  return { totalDue, totalPaid, pending: totalDue - totalPaid, overdueN, paidN };
}

// ── Display helpers ───────────────────────────────────────────────────────────

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

export function addMonths(monthStr: string, n: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const CURRENT_MONTH = "2026-06";
export const TERM_MONTHS   = ["2026-04", "2026-05", "2026-06"];
export const CLASS_NUMBERS = ["5", "6", "7", "8", "9", "10"];

export { ALL_STUDENTS, avatarColor };
export type { Student };
