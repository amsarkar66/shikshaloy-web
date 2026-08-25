"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Receipt, TrendingDown, Wallet, Search, Download, Plus,
  ArrowLeft, Printer, X, Check, Clock, Ban,
  BarChart2, ChevronLeft, ChevronRight, ChevronDown,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  computeMonthStats, computeCategoryBreakdown,
  STATUS_LABEL, STATUS_BADGE, categoryColor,
  formatCurrency, formatDate, formatMonth,
  type Expense, type ExpenseStatus, type BudgetLine,
} from "../_data/expenses";
import { addExpense } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";

// ── Month nav ─────────────────────────────────────────────────────────────────

function MonthNav({ months, index, onChange }: { months: string[]; index: number; onChange: (i: number) => void }) {
  const monthStr = months[index] ?? "";
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(index - 1)} disabled={index <= 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{monthStr ? formatMonth(monthStr) : "No data"}</span>
        {index === months.length - 1 && monthStr && <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>}
      </div>
      <button onClick={() => onChange(index + 1)} disabled={index >= months.length - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ expenses, budgets }: { expenses: Expense[]; budgets: BudgetLine[] }) {
  const { totalBudget, totalSpent, totalPending, remaining, count } = computeMonthStats(expenses, budgets);
  const spentPct = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const items = [
    { label: "Total Budget", value: totalBudget ? formatCurrency(totalBudget) : "—", icon: Wallet,       accent: "text-indigo-500  bg-indigo-500/10",  sub: totalBudget ? "Monthly allocation" : "No budgets set" },
    { label: "Total Spent",  value: formatCurrency(totalSpent),                       icon: TrendingDown, accent: "text-rose-500    bg-rose-500/10",    sub: totalBudget ? `${spentPct}% of budget` : `${count} expenses logged` },
    { label: "Pending",      value: formatCurrency(totalPending),                     icon: Clock,        accent: "text-amber-500   bg-amber-500/10",   sub: "Awaiting approval" },
    { label: "Remaining",    value: totalBudget ? formatCurrency(remaining) : "—",     icon: Receipt,      accent: "text-emerald-500 bg-emerald-500/10", sub: `${count} expenses logged` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 leading-tight">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Budget breakdown ──────────────────────────────────────────────────────────

function BudgetBreakdown({ expenses, budgets, monthStr }: { expenses: Expense[]; budgets: BudgetLine[]; monthStr: string }) {
  const rows = useMemo(() => computeCategoryBreakdown(expenses, budgets), [expenses, budgets]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-primary-500" />
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Budget vs. Spent — {formatMonth(monthStr)}</p>
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No expenses this month.</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {rows.map((row) => (
            <div key={row.category} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${categoryColor(row.category)}`} />
                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{row.category}</span>
                  {row.budget > 0 && row.pct >= 90 && (
                    <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">{row.pct}%</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500 dark:text-zinc-400 tabular-nums">{formatCurrency(row.spent)}</span>
                  {row.budget > 0 && (
                    <>
                      <span className="text-gray-300 dark:text-zinc-600">/</span>
                      <span className="font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{formatCurrency(row.budget)}</span>
                    </>
                  )}
                </div>
              </div>
              {row.budget > 0 ? (
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${row.pct >= 90 ? "bg-red-500" : row.pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(row.pct, 100)}%` }}
                  />
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">No budget cap set for this category</p>
              )}
              {row.pending > 0 && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">+{formatCurrency(row.pending)} pending approval</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add expense form ──────────────────────────────────────────────────────────

function AddExpenseForm({ categories, onClose, onAdded }: { categories: string[]; onClose: () => void; onAdded: () => void }) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptRef, setReceiptRef] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    const amt = Number(amount);
    if (!category || !amt || amt <= 0) { setError("Category and a valid amount are required."); return; }
    startTransition(async () => {
      try {
        await addExpense({ category, description, vendor, amount: amt, date, receiptRef });
        onAdded();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add expense.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Add Expense</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Category</label>
          <input list="expense-categories" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          <datalist id="expense-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} type="text" placeholder="Brief description…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Vendor / Payee</label>
          <input value={vendor} onChange={(e) => setVendor(e.target.value)} type="text" placeholder="Vendor name…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount (₹)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Receipt / Reference</label>
          <input value={receiptRef} onChange={(e) => setReceiptRef(e.target.value)} type="text" placeholder="Invoice or bill no. (optional)" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={isPending} className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 text-xs font-medium text-white transition-colors">
          {isPending ? "Submitting…" : "Submit for Approval"}
        </button>
        <button onClick={onClose} className="flex h-8 items-center px-3 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ── Expense detail ────────────────────────────────────────────────────────────

function ExpenseDetail({ expense, onBack }: { expense: Expense; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Expenses
        </button>
        <div className="sm:ml-auto flex gap-2">
          <FancyButton onClick={() => window.print()} size="xs">
            <Printer className="h-3.5 w-3.5" /> Print
          </FancyButton>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        <div className="bg-primary-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-primary-200 text-xs mt-0.5">Expense Voucher</p>
          </div>
          {expense.receiptRef && (
            <div className="text-right hidden sm:block">
              <p className="text-primary-200 text-[10px] uppercase tracking-widest font-semibold">Voucher No.</p>
              <p className="text-white text-sm font-bold font-mono">{expense.receiptRef}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Category",    value: expense.category },
              { label: "Vendor",      value: expense.vendor || "—" },
              { label: "Date",        value: formatDate(expense.date) },
              { label: "Description", value: expense.description || "—" },
              { label: "Month",       value: formatMonth(expense.monthStr) },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-5 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Amount</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-zinc-50 mt-0.5">{formatCurrency(expense.amount)}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${STATUS_BADGE[expense.status]}`}>
                {expense.status === "approved" ? <Check className="h-3.5 w-3.5 mr-1" /> : expense.status === "rejected" ? <Ban className="h-3.5 w-3.5 mr-1" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
                {STATUS_LABEL[expense.status].toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div>
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Submitted by</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature</p>
            </div>
            <p>Computer-generated voucher · Shikshaloy SMS</p>
            <div className="text-right">
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Principal</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature &amp; Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sort menu ─────────────────────────────────────────────────────────────────

type ExpenseSortKey = "date" | "amount" | "category" | "status";
const EXPENSE_SORT_OPTIONS: { key: ExpenseSortKey; label: string }[] = [
  { key: "date",     label: "Date" },
  { key: "amount",   label: "Amount" },
  { key: "category", label: "Category" },
  { key: "status",   label: "Status" },
];

function ExpenseSortMenu({
  sortBy, sortDir, open, onToggle, onKeyChange, onDirChange,
}: {
  sortBy: ExpenseSortKey; sortDir: "asc" | "desc"; open: boolean;
  onToggle: () => void; onKeyChange: (key: ExpenseSortKey) => void; onDirChange: (dir: "asc" | "desc") => void;
}) {
  const activeLabel = EXPENSE_SORT_OPTIONS.find((o) => o.key === sortBy)?.label;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowUpDown className="h-3.5 w-3.5" /> Sort: {activeLabel}
        {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10">
            {EXPENSE_SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => onKeyChange(o.key)}
                className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
              >
                <span className="truncate">{o.label}</span>
                {o.key === sortBy && <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-zinc-700/50" />
            <div className="flex items-center gap-1.5 p-1.5">
              <button
                onClick={() => onDirChange("asc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowUp className="h-3 w-3 shrink-0" /> Ascending
              </button>
              <button
                onClick={() => onDirChange("desc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowDown className="h-3 w-3 shrink-0" /> Descending
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Expense table ─────────────────────────────────────────────────────────────

function ExpenseTable({
  expenses, budgets, monthStr, categories, onView, onAdded, showAdd, setShowAdd,
}: {
  expenses: Expense[];
  budgets: BudgetLine[];
  monthStr: string;
  categories: string[];
  onView: (e: Expense) => void;
  onAdded: () => void;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategory] = useState<"all" | string>("all");
  const [statusFilter, setStatus] = useState<"all" | ExpenseStatus>("all");
  const [view, setView] = useState<"list" | "budget">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<ExpenseSortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const rows = expenses.filter((e) => {
      const matchQ = !q || e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      const matchC = categoryFilter === "all" || e.category === categoryFilter;
      const matchS = statusFilter === "all" || e.status === statusFilter;
      return matchQ && matchC && matchS;
    });
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date")     cmp = a.date.localeCompare(b.date);
      if (sortBy === "amount")   cmp = a.amount - b.amount;
      if (sortBy === "category") cmp = a.category.localeCompare(b.category);
      if (sortBy === "status")   cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [expenses, query, categoryFilter, statusFilter, sortBy, sortDir]);

  const activeFilterCount = [categoryFilter, statusFilter].filter((v) => v !== "all").length;
  const hasFilter = Boolean(query) || activeFilterCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {(["list", "budget"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${view === v ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            {v === "budget" ? <BarChart2 className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
            {v === "budget" ? "Budget View" : "Expense List"}
          </button>
        ))}
      </div>

      {showAdd && <AddExpenseForm categories={categories} onClose={() => setShowAdd(false)} onAdded={onAdded} />}

      {view === "budget" ? (
        <BudgetBreakdown expenses={expenses} budgets={budgets} monthStr={monthStr} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description, vendor or category…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <ExpenseSortMenu
              sortBy={sortBy}
              sortDir={sortDir}
              open={sortOpen}
              onToggle={() => setSortOpen((v) => !v)}
              onKeyChange={(key) => { setSortBy(key); setSortOpen(false); }}
              onDirChange={(dir) => { setSortDir(dir); setSortOpen(false); }}
            />

            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 space-y-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-lg shadow-black/10">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Category</label>
                      <div className="relative">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategory(e.target.value)}
                          className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatus(e.target.value as "all" | ExpenseStatus)}
                          className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="all">All Status</option>
                          <option value="approved">{STATUS_LABEL.approved}</option>
                          <option value="pending">{STATUS_LABEL.pending}</option>
                          <option value="rejected">{STATUS_LABEL.rejected}</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                      </div>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setCategory("all"); setStatus("all"); }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Clear all filters
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {hasFilter && (
              <button onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }} className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Table
            footer={
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
                  <span className="font-medium text-gray-700 dark:text-zinc-300">{expenses.length}</span> expenses
                </p>
                {hasFilter && <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>}
              </div>
            }
          >
            <TableHead>
              <Th position="first">Date</Th>
              <Th>Category</Th>
              <Th>Description</Th>
              <Th>Vendor</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th position="last" align="right"></Th>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={7} message="No expenses match this filter" />
              ) : filtered.map((expense) => (
                <Tr key={expense.id} className={expense.status === "rejected" ? "opacity-60" : ""}>
                  <Td position="first" className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(expense.date)}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-zinc-300">
                      <span className={`h-2 w-2 rounded-full ${categoryColor(expense.category)}`} />
                      {expense.category}
                    </span>
                  </Td>
                  <Td className="text-sm text-gray-800 dark:text-zinc-200 max-w-[200px] truncate">{expense.description || "—"}</Td>
                  <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{expense.vendor || "—"}</Td>
                  <Td className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100 whitespace-nowrap">{formatCurrency(expense.amount)}</Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[expense.status]}`}>
                      {expense.status === "approved" && <Check className="h-3 w-3" />}
                      {expense.status === "pending" && <Clock className="h-3 w-3" />}
                      {expense.status === "rejected" && <Ban className="h-3 w-3" />}
                      {STATUS_LABEL[expense.status]}
                    </span>
                  </Td>
                  <Td position="last" align="right">
                    <button onClick={() => onView(expense)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">View</button>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ExpensesClient({
  expenses, budgets,
}: {
  expenses: Expense[];
  budgets: BudgetLine[];
}) {
  const months = useMemo(() => Array.from(new Set(expenses.map((e) => e.monthStr))).sort(), [expenses]);
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.length - 1));
  const [selected, setSelected] = useState<Expense | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const monthStr = months[monthIndex] ?? "";
  const monthExpenses = useMemo(() => expenses.filter((e) => e.monthStr === monthStr), [expenses, monthStr]);
  const categories = useMemo(() => Array.from(new Set([...budgets.map((b) => b.category), ...expenses.map((e) => e.category)])).sort(), [expenses, budgets]);

  function handleMonthChange(i: number) {
    setMonthIndex(Math.max(0, Math.min(months.length - 1, i)));
    setSelected(null);
  }

  if (selected) {
    return (
      <div className="w-full px-6 py-6">
        <ExpenseDetail expense={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Expenses</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track institution expenses</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          {months.length > 0 && <MonthNav months={months} index={monthIndex} onChange={handleMonthChange} />}
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <FancyButton onClick={() => setShowAdd((v) => !v)} size="sm">
            <Plus className="h-4 w-4" /> Add Expense
          </FancyButton>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <Receipt className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No expenses recorded yet.</p>
        </div>
      ) : (
        <>
          <StatsRow expenses={monthExpenses} budgets={budgets} />
          <ExpenseTable
            expenses={monthExpenses}
            budgets={budgets}
            monthStr={monthStr}
            categories={categories}
            onView={(e) => setSelected(e)}
            onAdded={() => {}}
            showAdd={showAdd}
            setShowAdd={setShowAdd}
          />
        </>
      )}
    </div>
  );
}
