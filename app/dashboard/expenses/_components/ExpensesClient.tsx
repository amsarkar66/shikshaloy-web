"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Receipt, TrendingDown, Wallet, Search, Download, Plus,
  ArrowLeft, Printer, X, Check, Clock, Ban,
  BarChart2, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  computeMonthStats, computeCategoryBreakdown,
  STATUS_LABEL, STATUS_BADGE, categoryColor,
  formatCurrency, formatDate, formatMonth,
  type Expense, type ExpenseStatus, type BudgetLine,
} from "../_data/expenses";
import { addExpense } from "../actions";

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
        {index === months.length - 1 && monthStr && <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>}
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
        <BarChart2 className="h-4 w-4 text-indigo-500" />
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
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Add Expense</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Category</label>
          <input list="expense-categories" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
          <datalist id="expense-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} type="text" placeholder="Brief description…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Vendor / Payee</label>
          <input value={vendor} onChange={(e) => setVendor(e.target.value)} type="text" placeholder="Vendor name…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount (₹)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Date</label>
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
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
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Expenses
        </button>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={() => window.print()} className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-indigo-200 text-xs mt-0.5">Expense Voucher</p>
          </div>
          {expense.receiptRef && (
            <div className="text-right hidden sm:block">
              <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-semibold">Voucher No.</p>
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

// ── Expense table ─────────────────────────────────────────────────────────────

function ExpenseTable({
  expenses, budgets, monthStr, categories, onView, onAdded,
}: {
  expenses: Expense[];
  budgets: BudgetLine[];
  monthStr: string;
  categories: string[];
  onView: (e: Expense) => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategory] = useState<"all" | string>("all");
  const [statusFilter, setStatus] = useState<"all" | ExpenseStatus>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"list" | "budget">("list");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return expenses.filter((e) => {
      const matchQ = !q || e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      const matchC = categoryFilter === "all" || e.category === categoryFilter;
      const matchS = statusFilter === "all" || e.status === statusFilter;
      return matchQ && matchC && matchS;
    });
  }, [expenses, query, categoryFilter, statusFilter]);

  const hasFilter = query || categoryFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {(["list", "budget"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`h-8 px-4 text-xs font-medium capitalize transition-colors ${view === v ? "bg-indigo-500 text-white" : "bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {v === "budget" ? "Budget View" : "Expense List"}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="ml-auto flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {showAdd && <AddExpenseForm categories={categories} onClose={() => setShowAdd(false)} onAdded={onAdded} />}

      {view === "budget" ? (
        <BudgetBreakdown expenses={expenses} budgets={budgets} monthStr={monthStr} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description, vendor or category…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex items-center gap-1">
              {(["all", "approved", "pending", "rejected"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${statusFilter === s ? "bg-indigo-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                  {s === "all" ? "All Status" : STATUS_LABEL[s]}
                </button>
              ))}
              {hasFilter && (
                <button onClick={() => { setQuery(""); setCategory("all"); setStatus("all"); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCategory("all")} className={`h-7 rounded-full px-3 text-xs font-medium transition-colors ${categoryFilter === "all" ? "bg-indigo-500 text-white" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`h-7 rounded-full px-3 text-xs font-medium transition-colors flex items-center gap-1.5 ${categoryFilter === c ? "bg-indigo-500 text-white" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${categoryColor(c)}`} />
                {c}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-zinc-500">
            Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
            <span className="font-medium text-gray-700 dark:text-zinc-300">{expenses.length}</span> expenses
            {hasFilter && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">· Filters active</span>}
          </p>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
                  <tr>
                    {["Date", "Category", "Description", "Vendor", "Amount", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-sm text-gray-400 dark:text-zinc-500">No expenses match this filter</td></tr>
                  ) : filtered.map((expense) => (
                    <tr key={expense.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors ${expense.status === "rejected" ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-zinc-300">
                          <span className={`h-2 w-2 rounded-full ${categoryColor(expense.category)}`} />
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-zinc-200 max-w-[200px] truncate">{expense.description || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{expense.vendor || "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100 whitespace-nowrap">{formatCurrency(expense.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[expense.status]}`}>
                          {expense.status === "approved" && <Check className="h-3 w-3" />}
                          {expense.status === "pending" && <Clock className="h-3 w-3" />}
                          {expense.status === "rejected" && <Ban className="h-3 w-3" />}
                          {STATUS_LABEL[expense.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onView(expense)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track and manage school operating expenses</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          {months.length > 0 && <MonthNav months={months} index={monthIndex} onChange={handleMonthChange} />}
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
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
          />
        </>
      )}
    </div>
  );
}
