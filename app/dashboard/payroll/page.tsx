"use client";

import { useState, useMemo } from "react";
import {
  Wallet, CheckCircle2, Clock, PauseCircle,
  ChevronLeft, ChevronRight, Search, Download,
  ArrowLeft, Printer, Users, BadgeDollarSign,
  FileText, X,
} from "lucide-react";
import {
  ALL_STAFF, avatarColor, initials, deptColor, buildSalary,
  CURRENT_MONTH, TERM_MONTHS,
  getStaffMonthRecord, getSchoolPayrollStats,
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, formatDate, addMonths,
  type PayrollRecord, type PayrollStatus,
} from "./_data/payroll";

// ── Month nav ─────────────────────────────────────────────────────────────────

const PAYROLL_START = "2026-04";

function MonthNav({ monthStr, onChange }: { monthStr: string; onChange: (m: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonths(monthStr, -1))}
        disabled={monthStr <= PAYROLL_START}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{formatMonth(monthStr)}</span>
        {monthStr === CURRENT_MONTH && (
          <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Current</span>
        )}
      </div>

      <button
        onClick={() => onChange(addMonths(monthStr, 1))}
        disabled={monthStr >= CURRENT_MONTH}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ monthStr }: { monthStr: string }) {
  const stats = useMemo(() => getSchoolPayrollStats(monthStr), [monthStr]);

  const items = [
    { label: "Total Payroll",  value: formatCurrency(stats.totalPayroll), icon: Wallet,       accent: "text-indigo-500  bg-indigo-500/10",  sub: `${stats.totalStaff} staff members` },
    { label: "Disbursed",      value: formatCurrency(stats.totalPaid),    icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10", sub: `${stats.processedN} processed` },
    { label: "Pending",        value: String(stats.pendingN),             icon: Clock,        accent: "text-amber-500   bg-amber-500/10",   sub: "awaiting processing" },
    { label: "On Hold",        value: String(stats.onHoldN),              icon: PauseCircle,  accent: "text-zinc-500    bg-zinc-500/10",    sub: "staff on leave / inactive" },
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

// ── Pay slip ──────────────────────────────────────────────────────────────────

function PaySlip({
  staff, record, monthStr, onClose,
}: {
  staff:    typeof ALL_STAFF[0];
  record:   PayrollRecord;
  monthStr: string;
  onClose:  () => void;
}) {
  const salary = useMemo(() => buildSalary(staff), [staff]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Details
        </button>
        <button
          onClick={() => window.print()}
          className="sm:ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors"
        >
          <Printer className="h-3.5 w-3.5" /> Print Slip
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-indigo-200 text-xs mt-0.5">Salary Slip — {formatMonth(monthStr)}</p>
          </div>
          {record.slipNo && (
            <div className="text-right hidden sm:block">
              <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-semibold">Slip No.</p>
              <p className="text-white text-sm font-bold font-mono">{record.slipNo}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Employee info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Employee Name",  value: staff.name },
              { label: "Employee ID",    value: staff.employeeId },
              { label: "Designation",    value: staff.designation },
              { label: "Department",     value: staff.department },
              { label: "Pay Period",     value: formatMonth(monthStr) },
              { label: "Payment Date",   value: record.paidOn ? formatDate(record.paidOn) : "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Earnings + Deductions side-by-side */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">Earnings</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Component</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {salary.earnings.map((e) => (
                      <tr key={e.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300">{e.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-zinc-100 text-right tabular-nums">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100">Gross</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">{formatCurrency(salary.totalEarnings)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">Deductions</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Component</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 dark:text-zinc-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {salary.deductions.map((d) => (
                      <tr key={d.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300">{d.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 text-right tabular-nums">-{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 text-right tabular-nums">-{formatCurrency(salary.totalDeductions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Net pay summary */}
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 flex flex-wrap gap-8 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Gross Earnings</p>
              <p className="text-xl font-extrabold text-gray-800 dark:text-zinc-200 mt-0.5">{formatCurrency(salary.totalEarnings)}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">−</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Total Deductions</p>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(salary.totalDeductions)}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">=</div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Net Pay</p>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(salary.net)}</p>
            </div>
          </div>

          {/* Payment info */}
          {record.paidOn && (
            <div className="flex gap-6 text-sm text-gray-500 dark:text-zinc-400">
              <span>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300">{formatDate(record.paidOn)}</span></span>
              <span>via <span className="font-medium capitalize text-gray-700 dark:text-zinc-300">{record.payMode?.replace("_", " ")}</span></span>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div>
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Accountant</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature</p>
            </div>
            <p>Computer-generated slip. · Shikshaloy SMS</p>
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

// ── Staff salary detail ───────────────────────────────────────────────────────

function StaffPayDetail({
  staffId, monthStr, onBack,
}: {
  staffId:  number;
  monthStr: string;
  onBack:   () => void;
}) {
  const staff   = ALL_STAFF.find((s) => s.id === staffId)!;
  const salary  = useMemo(() => buildSalary(staff), [staff]);
  const record  = useMemo(() => getStaffMonthRecord(staff, monthStr), [staff, monthStr]);
  const history = useMemo(
    () => TERM_MONTHS.map((m) => ({ monthStr: m, record: getStaffMonthRecord(staff, m) })),
    [staff],
  );

  const [showSlip,   setShowSlip]   = useState(false);
  const [slipMonth,  setSlipMonth]  = useState(monthStr);

  if (showSlip) {
    return (
      <PaySlip
        staff={staff}
        record={getStaffMonthRecord(staff, slipMonth)}
        monthStr={slipMonth}
        onClose={() => setShowSlip(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Staff
        </button>

        <div className="sm:ml-2 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(staff.id)}`}>
            {initials(staff.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{staff.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{staff.designation} · {staff.employeeId}</p>
          </div>
        </div>

        <div className="sm:ml-auto flex gap-2">
          {record.status === "processed" && (
            <button
              onClick={() => { setSlipMonth(monthStr); setShowSlip(true); }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-3 text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Pay Slip
            </button>
          )}
          {record.status === "pending" && (
            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5" /> Process Salary
            </button>
          )}
        </div>
      </div>

      {/* Salary breakdown — current month */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Salary Breakdown — {formatMonth(monthStr)}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Pay date: 26–28 of every month</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700/50">
          {/* Earnings */}
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Earnings</p>
            <div className="space-y-2">
              {salary.earnings.map((e) => (
                <div key={e.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">{e.label}</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-zinc-100">Gross Total</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(salary.totalEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Deductions</p>
            <div className="space-y-2">
              {salary.deductions.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">{d.label}</span>
                  <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-zinc-100">Total Deductions</span>
                <span className="text-red-600 dark:text-red-400 tabular-nums">-{formatCurrency(salary.totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net pay bar */}
        <div className="px-4 py-4 bg-indigo-50 dark:bg-indigo-500/5 border-t border-indigo-100 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Net Pay</p>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(salary.net)}</p>
          </div>
          {record.paidOn && (
            <div className="text-xs text-gray-500 dark:text-zinc-400 text-right">
              <p>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300">{formatDate(record.paidOn)}</span></p>
              <p className="capitalize mt-0.5">via {record.payMode?.replace("_", " ")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Payroll History — AY 2026-27</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
            <tr>
              {["Month", "Gross", "Deductions", "Net Pay", "Status", "Slip"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {history.map(({ monthStr: m, record: r }) => (
              <tr key={m} className={`transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700/20 ${m === monthStr ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                  {formatMonth(m)}
                  {m === monthStr && <span className="ml-2 text-[10px] font-bold text-indigo-500">current</span>}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-zinc-400">{formatCurrency(r.gross)}</td>
                <td className="px-4 py-3 text-sm tabular-nums text-red-500 dark:text-red-400">-{formatCurrency(r.deductions)}</td>
                <td className="px-4 py-3 text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{formatCurrency(r.net)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "processed" ? (
                    <button
                      onClick={() => { setSlipMonth(m); setShowSlip(true); }}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Printer className="h-3 w-3" /> Print
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Payroll table (list view) ─────────────────────────────────────────────────

function PayrollTable({
  monthStr,
  onViewStaff,
}: {
  monthStr:    string;
  onViewStaff: (id: number) => void;
}) {
  const [query,        setQuery]  = useState("");
  const [typeFilter,   setType]   = useState<"all" | "teaching" | "non_teaching">("all");
  const [statusFilter, setStatus] = useState<"all" | PayrollStatus>("all");

  const active = useMemo(() => ALL_STAFF.filter((s) => s.status !== "inactive"), []);

  const rows = useMemo(
    () => active.map((s) => ({
      staff:  s,
      salary: buildSalary(s),
      record: getStaffMonthRecord(s, monthStr),
    })),
    [active, monthStr],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(({ staff, record }) => {
      const matchQ  = !q || staff.name.toLowerCase().includes(q) || staff.employeeId.includes(q) || staff.department.toLowerCase().includes(q);
      const matchTy = typeFilter === "all" || staff.type === typeFilter;
      const matchSt = statusFilter === "all" || record.status === statusFilter;
      return matchQ && matchTy && matchSt;
    });
  }, [rows, query, typeFilter, statusFilter]);

  const hasFilter = query || typeFilter !== "all" || statusFilter !== "all";

  const totals = useMemo(() => ({
    gross: filtered.reduce((a, r) => a + r.salary.gross, 0),
    net:   filtered.reduce((a, r) => a + r.salary.net, 0),
  }), [filtered]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, employee ID or department…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "teaching", "non_teaching"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${
                typeFilter === t
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t === "all" ? "All" : t === "teaching" ? "Teaching" : "Non-Teaching"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(["all", "processed", "pending", "on_hold"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s === "all" ? "All Status" : STATUS_LABEL[s as PayrollStatus]}
            </button>
          ))}
          {hasFilter && (
            <button
              onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{active.length}</span> staff
        {hasFilter && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">· Filters active</span>}
        <span className="ml-4">Total gross: <span className="font-medium text-gray-700 dark:text-zinc-300">{formatCurrency(totals.gross)}</span></span>
        <span className="ml-3">Total net: <span className="font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(totals.net)}</span></span>
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
              <tr>
                {["Employee", "Type", "Gross", "Deductions", "Net Pay", "Status", "Pay Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No staff match this filter
                  </td>
                </tr>
              ) : filtered.map(({ staff, salary, record }) => (
                <tr
                  key={staff.id}
                  className={`hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors ${record.status === "on_hold" ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(staff.id)}`}>
                        {initials(staff.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{staff.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{staff.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${deptColor(staff.department)}`}>
                      {staff.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                    {formatCurrency(salary.gross)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-red-500 dark:text-red-400">
                    -{formatCurrency(salary.totalDeductions)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(salary.net)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
                      {STATUS_LABEL[record.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {record.paidOn ? formatDate(record.paidOn) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onViewStaff(staff.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [monthStr,        setMonth]   = useState(CURRENT_MONTH);
  const [selectedStaffId, setStaff]   = useState<number | null>(null);

  function handleMonthChange(m: string) {
    setMonth(m);
    setStaff(null);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Payroll</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Process and track staff salaries</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <MonthNav monthStr={monthStr} onChange={handleMonthChange} />
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0">
            <BadgeDollarSign className="h-4 w-4" /> Process All
          </button>
        </div>
      </div>

      <StatsRow monthStr={monthStr} />

      {selectedStaffId ? (
        <StaffPayDetail
          staffId={selectedStaffId}
          monthStr={monthStr}
          onBack={() => setStaff(null)}
        />
      ) : (
        <PayrollTable
          monthStr={monthStr}
          onViewStaff={(id) => setStaff(id)}
        />
      )}
    </div>
  );
}
