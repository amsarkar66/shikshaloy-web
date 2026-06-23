export type ExpenseStatus = "approved" | "pending" | "rejected";
export type ExpenseCategory =
  | "Salaries"
  | "Utilities"
  | "Rent"
  | "Supplies"
  | "Maintenance"
  | "Transport"
  | "Food & Canteen"
  | "IT & Software"
  | "Marketing"
  | "Miscellaneous";

export interface Expense {
  id:          number;
  monthStr:    string;
  date:        string;
  category:    ExpenseCategory;
  description: string;
  vendor:      string;
  amount:      number;
  status:      ExpenseStatus;
  receiptRef?: string;
  approvedBy?: string;
}

export interface BudgetLine {
  category: ExpenseCategory;
  budget:   number;
}

// ── Budget ────────────────────────────────────────────────────────────────────

export const MONTHLY_BUDGET: BudgetLine[] = [
  { category: "Salaries",       budget: 850000 },
  { category: "Utilities",      budget: 45000  },
  { category: "Rent",           budget: 120000 },
  { category: "Supplies",       budget: 30000  },
  { category: "Maintenance",    budget: 25000  },
  { category: "Transport",      budget: 60000  },
  { category: "Food & Canteen", budget: 35000  },
  { category: "IT & Software",  budget: 20000  },
  { category: "Marketing",      budget: 15000  },
  { category: "Miscellaneous",  budget: 20000  },
];

export const TOTAL_BUDGET = MONTHLY_BUDGET.reduce((a, b) => a + b.budget, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function monthHash(monthStr: string): number {
  return monthStr.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

// ── Expense generation ────────────────────────────────────────────────────────

const VENDOR_BY_CATEGORY: Record<ExpenseCategory, string[]> = {
  "Salaries":       ["Staff Payroll", "Teacher Payroll", "Admin Payroll"],
  "Utilities":      ["MSEDCL", "Mahanagar Gas", "BSNL Broadband", "Jio Fiber"],
  "Rent":           ["Property Owner Trust", "Bhavani Properties"],
  "Supplies":       ["Sharma Stationery", "Gupta Traders", "National Book Depot"],
  "Maintenance":    ["Ravi Electricals", "Plumb Right Services", "QuickFix Solutions"],
  "Transport":      ["Fuel Station", "Roadways Workshop", "Tyre Point"],
  "Food & Canteen": ["Sai Catering", "Fresh Farm Supplies", "Veggies Direct"],
  "IT & Software":  ["Microsoft India", "Google Workspace", "Tally Solutions"],
  "Marketing":      ["Creative Ads Agency", "Print House", "Digital Boost"],
  "Miscellaneous":  ["General Supplies", "Petty Cash", "Miscellaneous Vendor"],
};

const DESC_BY_CATEGORY: Record<ExpenseCategory, string[]> = {
  "Salaries":       ["Monthly salary disbursement", "Teaching staff payroll", "Administrative staff payroll"],
  "Utilities":      ["Monthly electricity bill", "Gas connection charges", "Internet & broadband", "Mobile recharge"],
  "Rent":           ["Monthly premises rent", "Storage space rent"],
  "Supplies":       ["Stationery & office supplies", "Exam paper and answer sheets", "Lab consumables"],
  "Maintenance":    ["Electrical repairs", "Plumbing work", "Building maintenance"],
  "Transport":      ["Diesel for school buses", "Vehicle servicing", "Tyre replacement"],
  "Food & Canteen": ["Monthly canteen contract", "Vegetables & groceries", "Drinking water cans"],
  "IT & Software":  ["Annual subscription renewal", "Software license fee", "Cloud storage"],
  "Marketing":      ["Admission brochure printing", "Social media ads", "Banner & flex board"],
  "Miscellaneous":  ["Miscellaneous purchases", "Petty cash expenses", "Event supplies"],
};

function genExpenses(monthStr: string): Expense[] {
  const mh  = monthHash(monthStr);
  const [y, m] = monthStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const expenses: Expense[] = [];
  let id = mh % 1000 + 1;

  for (const line of MONTHLY_BUDGET) {
    const cat = line.category;
    const vendors = VENDOR_BY_CATEGORY[cat];
    const descs   = DESC_BY_CATEGORY[cat];

    // salaries: 1 big entry; others: 1-3 entries
    const count = cat === "Salaries" ? 1 : 1 + Math.floor(lcg(mh + id) * 2.5);
    let remaining = line.budget;

    for (let i = 0; i < count; i++) {
      const seed      = mh * id + i * 97;
      const ratio     = count === 1 ? 1 : (0.3 + lcg(seed) * 0.55);
      const amount    = count === 1 ? line.budget : Math.round(remaining * ratio / 100) * 100;
      remaining      -= amount;
      const day       = 1 + Math.floor(lcg(seed * 3) * (daysInMonth - 1));
      const statusRng = lcg(seed * 7);
      const status: ExpenseStatus =
        cat === "Salaries" ? "approved"
        : statusRng < 0.70 ? "approved"
        : statusRng < 0.85 ? "pending"
        : "rejected";

      expenses.push({
        id:          id++,
        monthStr,
        date:        `${monthStr}-${String(day).padStart(2, "0")}`,
        category:    cat,
        description: descs[Math.floor(lcg(seed * 5) * descs.length)],
        vendor:      vendors[Math.floor(lcg(seed * 11) * vendors.length)],
        amount,
        status,
        receiptRef:  status === "approved" ? `EXP-${monthStr.replace("-", "")}-${String(id).padStart(4, "0")}` : undefined,
        approvedBy:  status === "approved" ? "Principal" : undefined,
      });
    }
  }

  return expenses.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Public API ────────────────────────────────────────────────────────────────

const cache = new Map<string, Expense[]>();

export function getExpenses(monthStr: string): Expense[] {
  if (!cache.has(monthStr)) cache.set(monthStr, genExpenses(monthStr));
  return cache.get(monthStr)!;
}

export function getMonthStats(monthStr: string) {
  const expenses = getExpenses(monthStr);
  const approved = expenses.filter((e) => e.status === "approved");
  const pending  = expenses.filter((e) => e.status === "pending");
  const totalSpent   = approved.reduce((a, e) => a + e.amount, 0);
  const totalPending = pending.reduce((a, e) => a + e.amount, 0);
  return {
    totalBudget:  TOTAL_BUDGET,
    totalSpent,
    totalPending,
    remaining:    TOTAL_BUDGET - totalSpent,
    count:        expenses.length,
    approvedN:    approved.length,
    pendingN:     pending.length,
  };
}

export function getCategoryBreakdown(monthStr: string) {
  const expenses = getExpenses(monthStr);
  return MONTHLY_BUDGET.map((line) => {
    const catExpenses = expenses.filter((e) => e.category === line.category);
    const spent = catExpenses
      .filter((e) => e.status === "approved")
      .reduce((a, e) => a + e.amount, 0);
    const pending = catExpenses
      .filter((e) => e.status === "pending")
      .reduce((a, e) => a + e.amount, 0);
    return {
      category: line.category,
      budget:   line.budget,
      spent,
      pending,
      remaining: line.budget - spent,
      pct:       Math.min(100, Math.round((spent / line.budget) * 100)),
    };
  });
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  approved: "Approved",
  pending:  "Pending",
  rejected: "Rejected",
};

export const STATUS_BADGE: Record<ExpenseStatus, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  "Salaries":       "bg-indigo-500",
  "Utilities":      "bg-blue-500",
  "Rent":           "bg-violet-500",
  "Supplies":       "bg-amber-500",
  "Maintenance":    "bg-orange-500",
  "Transport":      "bg-teal-500",
  "Food & Canteen": "bg-green-500",
  "IT & Software":  "bg-cyan-500",
  "Marketing":      "bg-pink-500",
  "Miscellaneous":  "bg-zinc-400",
};

export const ALL_CATEGORIES: ExpenseCategory[] = MONTHLY_BUDGET.map((b) => b.category);

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

export function addMonths(monthStr: string, n: number): string {
  const [y, mo] = monthStr.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const CURRENT_MONTH  = "2026-06";
export const ACADEMIC_START = "2026-04";
export const TERM_MONTHS    = ["2026-04", "2026-05", "2026-06"];
