export type ExpenseStatus = "approved" | "pending" | "rejected";

export interface Expense {
  id: string;
  monthStr: string;
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  status: ExpenseStatus;
  receiptRef: string | null;
  schoolId?: string;
  schoolName?: string;
}

export interface BudgetLine {
  category: string;
  budget: number;
}

export interface CategoryBreakdownRow {
  category: string;
  budget: number;
  spent: number;
  pending: number;
  remaining: number;
  pct: number;
}

export function computeMonthStats(expenses: Expense[], budgets: BudgetLine[]) {
  const totalBudget = budgets.reduce((a, b) => a + b.budget, 0);
  const approved = expenses.filter((e) => e.status === "approved");
  const pending = expenses.filter((e) => e.status === "pending");
  const totalSpent = approved.reduce((a, e) => a + e.amount, 0);
  const totalPending = pending.reduce((a, e) => a + e.amount, 0);
  return {
    totalBudget,
    totalSpent,
    totalPending,
    remaining: totalBudget - totalSpent,
    count: expenses.length,
    approvedN: approved.length,
    pendingN: pending.length,
  };
}

export function computeCategoryBreakdown(expenses: Expense[], budgets: BudgetLine[]): CategoryBreakdownRow[] {
  const categories = Array.from(new Set([...budgets.map((b) => b.category), ...expenses.map((e) => e.category)]));
  return categories.map((category) => {
    const budget = budgets.find((b) => b.category === category)?.budget ?? 0;
    const catExpenses = expenses.filter((e) => e.category === category);
    const spent = catExpenses.filter((e) => e.status === "approved").reduce((a, e) => a + e.amount, 0);
    const pending = catExpenses.filter((e) => e.status === "pending").reduce((a, e) => a + e.amount, 0);
    return {
      category,
      budget,
      spent,
      pending,
      remaining: budget - spent,
      pct: budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0,
    };
  });
}

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

export const STATUS_BADGE: Record<ExpenseStatus, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

const CATEGORY_COLORS = [
  "bg-indigo-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-orange-500",
  "bg-teal-500", "bg-green-500", "bg-cyan-500", "bg-pink-500", "bg-rose-500",
];

export function categoryColor(category: string): string {
  const n = category.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return CATEGORY_COLORS[n % CATEGORY_COLORS.length];
}

export function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatMonth(monthStr: string): string {
  const [y, mo] = monthStr.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
