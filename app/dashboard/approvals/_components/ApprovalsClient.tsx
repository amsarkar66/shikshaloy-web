"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarOff, UserPlus, Receipt, Wallet,
  Check, Ban, Loader2, ChevronDown, Landmark, CheckCircle2,
} from "lucide-react";
import { updateApplicationStatus } from "../../admissions/actions";
import { updateExpenseStatus } from "../../expenses/actions";
import { processAllPending } from "../../payroll/actions";
import LeaveRequestsPanel, { type Leave } from "./LeaveRequestsPanel";

export interface SchoolOption {
  id: string;
  name: string;
}

export interface AdmissionApprovalRow {
  id: string;
  applicantName: string;
  grade: string;
  parentName: string | null;
  submittedDate: string | null;
  schoolId: string;
  schoolName: string;
}

export interface ExpenseApprovalRow {
  id: string;
  category: string;
  description: string | null;
  vendor: string | null;
  amount: number;
  date: string;
  schoolId: string;
  schoolName: string;
}

export interface PayrollApprovalGroup {
  schoolId: string;
  schoolName: string;
  monthStr: string;
  pendingCount: number;
  totalNet: number;
}

type CategoryKey = "leave" | "admissions" | "expenses" | "payroll";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function SchoolTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
      <Landmark className="h-3 w-3 shrink-0 text-violet-400" />{name}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{message}</p>
    </div>
  );
}

export default function ApprovalsClient({
  schools, leaves, admissions, expenses, payroll,
}: {
  schools: SchoolOption[];
  leaves: Leave[];
  admissions: AdmissionApprovalRow[];
  expenses: ExpenseApprovalRow[];
  payroll: PayrollApprovalGroup[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryKey>("leave");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingLeaveCount = useMemo(() => leaves.filter((l) => l.status === "pending").length, [leaves]);

  const categories: { key: CategoryKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: "leave",      label: "Leave Requests", icon: CalendarOff, count: pendingLeaveCount },
    { key: "admissions", label: "Admissions",     icon: UserPlus,    count: admissions.length },
    { key: "expenses",   label: "Expenses",       icon: Receipt,     count: expenses.length },
    { key: "payroll",    label: "Payroll",        icon: Wallet,      count: payroll.length },
  ];

  const filteredAdmissions = useMemo(
    () => schoolFilter === "all" ? admissions : admissions.filter((a) => a.schoolId === schoolFilter),
    [admissions, schoolFilter]
  );
  const filteredExpenses = useMemo(
    () => schoolFilter === "all" ? expenses : expenses.filter((e) => e.schoolId === schoolFilter),
    [expenses, schoolFilter]
  );
  const filteredPayroll = useMemo(
    () => schoolFilter === "all" ? payroll : payroll.filter((p) => p.schoolId === schoolFilter),
    [payroll, schoolFilter]
  );

  async function runAction(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Approvals</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Everything awaiting your decision, across {schools.length} school{schools.length === 1 ? "" : "s"} in your institution
          </p>
        </div>
        {category !== "leave" && (
          <div className="sm:ml-auto relative">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="all">All Schools</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div key={c.key} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-violet-500 bg-violet-500/10">
              <c.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-gray-900 dark:text-zinc-50">{c.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:w-56 md:shrink-0">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                category === c.key
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              <c.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{c.label}</span>
              {c.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-[14px] font-semibold ${
                  category === c.key
                    ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                }`}>
                  {c.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 space-y-4">
          {category === "leave" && (
            <LeaveRequestsPanel initialLeaves={leaves} schools={schools} />
          )}

          {category === "admissions" && (
            filteredAdmissions.length === 0 ? <EmptyState message="No admission applications waiting for a decision" /> : (
              <div className="space-y-2.5">
                {filteredAdmissions.map((a) => {
                  const isBusy = busyId === a.id;
                  return (
                    <div key={a.id} className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{a.applicantName}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          Applying for Class {a.grade}{a.parentName ? ` · Parent: ${a.parentName}` : ""} · Submitted {formatDate(a.submittedDate)}
                        </p>
                        <div className="mt-2"><SchoolTag name={a.schoolName} /></div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          disabled={isBusy}
                          onClick={() => runAction(a.id, () => updateApplicationStatus(a.id, "rejected"))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => runAction(a.id, () => updateApplicationStatus(a.id, "approved"))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {category === "expenses" && (
            filteredExpenses.length === 0 ? <EmptyState message="No expenses waiting for a decision" /> : (
              <div className="space-y-2.5">
                {filteredExpenses.map((e) => {
                  const isBusy = busyId === e.id;
                  return (
                    <div key={e.id} className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{e.category}</p>
                          <span className="text-sm font-bold text-gray-900 dark:text-zinc-50">₹{e.amount.toLocaleString("en-IN")}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          {[e.vendor, e.description].filter(Boolean).join(" · ") || "No further details"} · {formatDate(e.date)}
                        </p>
                        <div className="mt-2"><SchoolTag name={e.schoolName} /></div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          disabled={isBusy}
                          onClick={() => runAction(e.id, () => updateExpenseStatus(e.id, "rejected"))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => runAction(e.id, () => updateExpenseStatus(e.id, "approved"))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {category === "payroll" && (
            filteredPayroll.length === 0 ? <EmptyState message="No payroll runs waiting to be released" /> : (
              <div className="space-y-2.5">
                {filteredPayroll.map((p) => {
                  const key = `${p.schoolId}:${p.monthStr}`;
                  const isBusy = busyId === key;
                  return (
                    <div key={key} className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{formatMonth(p.monthStr)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          {p.pendingCount} staff member{p.pendingCount === 1 ? "" : "s"} · ₹{p.totalNet.toLocaleString("en-IN")} total net
                        </p>
                        <div className="mt-2"><SchoolTag name={p.schoolName} /></div>
                      </div>
                      <button
                        disabled={isBusy}
                        onClick={() => runAction(key, () => processAllPending(p.monthStr, p.schoolId))}
                        className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 px-3 text-xs font-semibold text-white transition-colors"
                      >
                        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Release All
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
