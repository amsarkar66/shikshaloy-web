"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, TrendingUp, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Search, Download, Plus,
  ArrowLeft, Printer, Phone, GraduationCap, Wallet,
  Receipt, X,
} from "lucide-react";
import {
  ALL_STUDENTS, avatarColor,
  CURRENT_MONTH, TERM_MONTHS, CLASS_NUMBERS,
  getMonthlyFeeRecord, getFeeLineItems, getMonthlyDue, getSchoolMonthStats,
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, formatDate, addMonths,
  type MonthlyFeeRecord, type PaymentStatus,
} from "./_data/fees";

// ── Month navigation ──────────────────────────────────────────────────────────

const ACADEMIC_START = "2026-04";

function MonthNav({
  monthStr, onChange,
}: {
  monthStr: string;
  onChange: (m: string) => void;
}) {
  const isFirst   = monthStr <= ACADEMIC_START;
  const isCurrent = monthStr >= CURRENT_MONTH;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonths(monthStr, -1))}
        disabled={isFirst}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{formatMonth(monthStr)}</span>
        {isCurrent && (
          <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Current</span>
        )}
      </div>

      <button
        onClick={() => onChange(addMonths(monthStr, 1))}
        disabled={isCurrent}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ monthStr }: { monthStr: string }) {
  const { totalDue, totalPaid, pending, overdueN, paidN } = useMemo(
    () => getSchoolMonthStats(monthStr),
    [monthStr],
  );
  const rate = Math.round((totalPaid / totalDue) * 100);

  const items = [
    { label: "Total Due",    value: formatCurrency(totalDue),  icon: CreditCard,   accent: "text-indigo-500  bg-indigo-500/10",  sub: `${ALL_STUDENTS.filter(s=>s.active).length} students` },
    { label: "Collected",    value: formatCurrency(totalPaid), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10", sub: `${paidN} fully paid` },
    { label: "Pending",      value: formatCurrency(pending),   icon: Wallet,       accent: "text-amber-500   bg-amber-500/10",   sub: `${overdueN} overdue` },
    { label: "Collection %", value: `${rate}%`,                icon: TrendingUp,   accent: "text-blue-500    bg-blue-500/10",    sub: `${rate < 80 ? "Below target" : "On track"}` },
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

// ── Fee receipt ───────────────────────────────────────────────────────────────

function FeeReceipt({
  record, student, onClose,
}: {
  record:  MonthlyFeeRecord;
  student: typeof ALL_STUDENTS[0];
  onClose: () => void;
}) {
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
          <Printer className="h-3.5 w-3.5" /> Print Receipt
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {/* Receipt card */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-indigo-200 text-xs mt-0.5">Fee Payment Receipt</p>
          </div>
          {record.receiptNo && (
            <div className="text-right hidden sm:block">
              <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-semibold">Receipt No.</p>
              <p className="text-white text-sm font-bold font-mono">{record.receiptNo}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Student details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Student Name",  value: student.name },
              { label: "Roll Number",   value: student.rollNo },
              { label: "Class",         value: `Class ${student.class}-${student.section}` },
              { label: "Parent",        value: student.parent },
              { label: "Fee Period",    value: formatMonth(record.monthStr) },
              { label: "Payment Date",  value: record.paidDate ? formatDate(record.paidDate) : "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Fee breakdown */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Fee Breakdown</p>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    {["Category", "Amount", "Paid", "Balance"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {record.lineItems.map((item) => (
                    <tr key={item.category} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-zinc-200">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 tabular-nums">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(item.paid)}</td>
                      <td className="px-4 py-3 text-sm tabular-nums text-gray-500 dark:text-zinc-500">{formatCurrency(item.amount - item.paid)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100">Total</td>
                    <td className="px-4 py-3 text-sm font-bold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(record.totalDue)}</td>
                    <td className="px-4 py-3 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(record.totalPaid)}</td>
                    <td className="px-4 py-3 text-sm font-bold tabular-nums text-red-500 dark:text-red-400">{formatCurrency(record.balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-5 flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Amount Paid</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(record.totalPaid)}</p>
            </div>
            {record.balance > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Balance Due</p>
                <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(record.balance)}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Payment Mode</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mt-0.5 capitalize">{record.payMode ?? "—"}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${STATUS_BADGE[record.status]}`}>
                {record.status === "paid" ? "✓ PAID" : STATUS_LABEL[record.status].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div>
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Accountant</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature</p>
            </div>
            <p>This is a computer-generated receipt. · Shikshaloy SMS</p>
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

// ── Student fee detail ────────────────────────────────────────────────────────

function StudentFeeDetail({
  studentId, monthStr, onBack,
}: {
  studentId: number;
  monthStr:  string;
  onBack:    () => void;
}) {
  const student  = ALL_STUDENTS.find((s) => s.id === studentId)!;
  const record   = useMemo(() => getMonthlyFeeRecord(student, monthStr), [student, monthStr]);
  const history  = useMemo(
    () => TERM_MONTHS.map((m) => ({ monthStr: m, record: getMonthlyFeeRecord(student, m) })),
    [student],
  );

  const [showReceipt, setShowReceipt]     = useState(false);
  const [receiptMonth, setReceiptMonth]   = useState(monthStr);
  const [showPayForm, setShowPayForm]     = useState(false);

  if (showReceipt) {
    const receiptRecord = getMonthlyFeeRecord(student, receiptMonth);
    return (
      <FeeReceipt
        record={receiptRecord}
        student={student}
        onClose={() => setShowReceipt(false)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Students
        </button>

        <div className="sm:ml-2 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(student.id)}`}>
            {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{student.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Class {student.class}-{student.section} · {student.rollNo}</p>
          </div>
        </div>

        <div className="sm:ml-auto flex gap-2">
          {record.status !== "paid" && (
            <button
              onClick={() => setShowPayForm((v) => !v)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Record Payment
            </button>
          )}
          {record.status === "paid" && (
            <button
              onClick={() => { setReceiptMonth(monthStr); setShowReceipt(true); }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-3 text-xs font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Receipt
            </button>
          )}
          <a
            href={`tel:${student.phone}`}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" /> Call Parent
          </a>
        </div>
      </div>

      {/* Inline payment form */}
      {showPayForm && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-500/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Record Payment — {formatMonth(monthStr)}</p>
            <button onClick={() => setShowPayForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount (₹)</label>
              <input
                type="number"
                defaultValue={record.balance}
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Payment Date</label>
              <input
                type="date"
                defaultValue={CURRENT_MONTH + "-23"}
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Payment Mode</label>
              <select className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
                <option value="online">Online Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-xs font-medium text-white transition-colors">
              Save Payment
            </button>
            <button onClick={() => setShowPayForm(false)} className="flex h-8 items-center px-3 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fee breakdown — current month */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Fee Breakdown — {formatMonth(monthStr)}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Due date: 10th of every month</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
            <tr>
              {["Category", "Monthly Amount", "Paid", "Balance"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {record.lineItems.map((item) => (
              <tr key={item.category} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20">
                <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-zinc-200">{item.category}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400 tabular-nums">{formatCurrency(item.amount)}</td>
                <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(item.paid)}</td>
                <td className={`px-4 py-3 text-sm font-semibold tabular-nums ${item.amount - item.paid > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                  {formatCurrency(item.amount - item.paid)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100">Total</td>
              <td className="px-4 py-3 text-sm font-bold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(record.totalDue)}</td>
              <td className="px-4 py-3 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(record.totalPaid)}</td>
              <td className={`px-4 py-3 text-sm font-bold tabular-nums ${record.balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                {formatCurrency(record.balance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {record.paidDate && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-700/50 flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400">
            <span>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300">{formatDate(record.paidDate)}</span></span>
            {record.payMode && (
              <span>via <span className="font-medium capitalize text-gray-700 dark:text-zinc-300">{record.payMode}</span></span>
            )}
            {record.receiptNo && (
              <span className="font-mono text-[11px]">{record.receiptNo}</span>
            )}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Payment History — {new Date(monthStr + "-01").getFullYear()}-{String(parseInt(monthStr.split("-")[0]) + 1).slice(-2)}</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
            <tr>
              {["Month", "Amount Due", "Paid", "Balance", "Status", "Receipt"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {history.map(({ monthStr: m, record: r }) => (
              <tr key={m} className={`hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors ${m === monthStr ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}`}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                  {formatMonth(m)}
                  {m === monthStr && <span className="ml-2 text-[10px] font-bold text-indigo-500">current</span>}
                </td>
                <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-zinc-400">{formatCurrency(r.totalDue)}</td>
                <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(r.totalPaid)}</td>
                <td className={`px-4 py-3 text-sm font-semibold tabular-nums ${r.balance > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                  {formatCurrency(r.balance)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status === "paid" ? (
                    <button
                      onClick={() => { setReceiptMonth(m); setShowReceipt(true); }}
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

// ── Fee table (list view) ─────────────────────────────────────────────────────

function FeeTable({
  monthStr,
  onViewStudent,
}: {
  monthStr:       string;
  onViewStudent:  (id: number) => void;
}) {
  const [query,        setQuery]  = useState("");
  const [classFilter,  setClass]  = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const activeStudents = useMemo(() => ALL_STUDENTS.filter((s) => s.active), []);
  const records = useMemo(
    () => activeStudents.map((s) => ({ student: s, record: getMonthlyFeeRecord(s, monthStr) })),
    [activeStudents, monthStr],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(({ student, record }) => {
      const matchQ  = !q || student.name.toLowerCase().includes(q) || student.rollNo.includes(q) || student.parent.toLowerCase().includes(q);
      const matchCl = classFilter  === "all" || student.class === classFilter;
      const matchSt = statusFilter === "all" || record.status === statusFilter;
      return matchQ && matchCl && matchSt;
    });
  }, [records, query, classFilter, statusFilter]);

  const hasFilter = query || classFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, roll no or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Class filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...CLASS_NUMBERS].map((c) => (
            <button
              key={c}
              onClick={() => setClass(c)}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                classFilter === c
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(["all", "paid", "partial", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s === "all" ? "All Status" : STATUS_LABEL[s as PaymentStatus]}
            </button>
          ))}
          {hasFilter && (
            <button
              onClick={() => { setQuery(""); setClass("all"); setStatus("all"); }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{activeStudents.length}</span> students
        {hasFilter && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">· Filters active</span>}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
              <tr>
                {["Student", "Class", "Monthly Due", "Paid", "Balance", "Status", "Due Date", ""].map((h) => (
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
                    No students match this filter
                  </td>
                </tr>
              ) : filtered.map(({ student, record }) => (
                <tr
                  key={student.id}
                  className={`hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors ${record.status === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(student.id)}`}>
                        {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{student.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{student.rollNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-6 items-center justify-center rounded-md bg-indigo-500/10 px-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {student.class}-{student.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                    {formatCurrency(record.totalDue)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(record.totalPaid)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold tabular-nums ${record.balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                    {formatCurrency(record.balance)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
                      {STATUS_LABEL[record.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {monthStr}-10
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onViewStudent(student.id)}
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

export default function FeesPage() {
  const [monthStr,         setMonth]    = useState(CURRENT_MONTH);
  const [selectedStudentId, setStudent] = useState<number | null>(null);

  function handleMonthChange(m: string) {
    setMonth(m);
    setStudent(null);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Fee Management</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track and collect student fees</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <MonthNav monthStr={monthStr} onChange={handleMonthChange} />
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0">
            <Plus className="h-4 w-4" /> Add Payment
          </button>
        </div>
      </div>

      <StatsRow monthStr={monthStr} />

      {selectedStudentId ? (
        <StudentFeeDetail
          studentId={selectedStudentId}
          monthStr={monthStr}
          onBack={() => setStudent(null)}
        />
      ) : (
        <FeeTable
          monthStr={monthStr}
          onViewStudent={(id) => setStudent(id)}
        />
      )}
    </div>
  );
}
