"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard, TrendingUp, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, Search, Download, Plus,
  ArrowLeft, Printer, Phone, Wallet,
  Receipt, X, Settings2, Sparkles, Pencil, Trash2, Loader2,
} from "lucide-react";
import {
  STATUS_LABEL, STATUS_BADGE, CLASS_NUMBERS,
  formatCurrency, formatMonth, formatDate, avatarColor,
  buildMonthlyRecord,
  type FeeStudent, type FeePaymentRow, type MonthlyFeeRecord, type PaymentStatus, type PaymentMode,
  type FeeStructure, type GradeOption,
} from "../_data/fees";
import { recordFeePayment, createFeeStructure, updateFeeStructure, deleteFeeStructure, generateMonthlyFees } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow, TableTitleHeader } from "@/components/ui/data-table";

// ── Month navigation ──────────────────────────────────────────────────────────

function MonthNav({
  months, index, onChange,
}: {
  months: string[];
  index: number;
  onChange: (i: number) => void;
}) {
  const monthStr = months[index] ?? "";
  const isFirst = index <= 0;
  const isLast = index >= months.length - 1;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(index - 1)}
        disabled={isFirst}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{monthStr ? formatMonth(monthStr) : "No data"}</span>
        {isLast && monthStr && (
          <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>
        )}
      </div>

      <button
        onClick={() => onChange(index + 1)}
        disabled={isLast}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ records, activeCount }: { records: MonthlyFeeRecord[]; activeCount: number }) {
  const totalDue  = records.reduce((s, r) => s + r.totalDue, 0);
  const totalPaid = records.reduce((s, r) => s + r.totalPaid, 0);
  const pending   = totalDue - totalPaid;
  const overdueN  = records.filter((r) => r.status === "overdue").length;
  const paidN     = records.filter((r) => r.status === "paid").length;
  const rate      = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  const items = [
    { label: "Total Due",    value: formatCurrency(totalDue),  icon: CreditCard,   accent: "text-indigo-500  bg-indigo-500/10",  sub: `${activeCount} students` },
    { label: "Collected",    value: formatCurrency(totalPaid), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10", sub: `${paidN} fully paid` },
    { label: "Pending",      value: formatCurrency(pending),   icon: Wallet,       accent: "text-amber-500   bg-amber-500/10",   sub: `${overdueN} overdue` },
    { label: "Collection %", value: `${rate}%`,                icon: TrendingUp,   accent: "text-blue-500    bg-blue-500/10",    sub: rate < 80 ? "Below target" : "On track" },
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
  student: FeeStudent;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Details
        </button>
        <FancyButton
          onClick={() => window.print()}
          size="xs"
          className="sm:ml-auto"
        >
          <Printer className="h-3.5 w-3.5" /> Print Receipt
        </FancyButton>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        <div className="bg-primary-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-primary-200 text-xs mt-0.5">Fee Payment Receipt</p>
          </div>
          {record.receiptNo && (
            <div className="text-right hidden sm:block">
              <p className="text-primary-200 text-[10px] uppercase tracking-widest font-semibold">Receipt No.</p>
              <p className="text-white text-sm font-bold font-mono">{record.receiptNo}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Student Name",  value: student.name },
              { label: "Roll Number",   value: student.rollNo },
              { label: "Class",         value: `Class ${student.classNum}-${student.section}` },
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
                  {record.lineItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
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

// ── Record payment modal ──────────────────────────────────────────────────────

function RecordPaymentModal({
  student, monthStr, balance, onClose, onSaved,
}: {
  student: FeeStudent;
  monthStr: string;
  balance: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(String(balance));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<PaymentMode>("online");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit() {
    setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    startTransition(async () => {
      try {
        await recordFeePayment(student.id, monthStr, amt, paidDate, mode);
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record payment.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Record Payment</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{student.name} · {formatMonth(monthStr)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-zinc-400">Outstanding balance</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatCurrency(balance)}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount (₹)</label>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Payment Date</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Payment Mode</label>
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as PaymentMode)}
                  className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="online">Online Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="flex h-8 items-center px-3 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            Cancel
          </button>
          <FancyButton
            onClick={handleSubmit}
            disabled={isPending}
            size="xs"
          >
            {isPending ? "Saving…" : "Save Payment"}
          </FancyButton>
        </div>
      </div>
    </div>
  );
}

// ── Student fee detail ────────────────────────────────────────────────────────

function StudentFeeDetail({
  student, months, monthStr, paymentsByMonth, onBack,
}: {
  student: FeeStudent;
  months: string[];
  monthStr: string;
  paymentsByMonth: Map<string, FeePaymentRow[]>;
  onBack: () => void;
}) {
  const record  = useMemo(() => buildMonthlyRecord(student.id, monthStr, paymentsByMonth.get(monthStr) ?? []), [student.id, monthStr, paymentsByMonth]);
  const history = useMemo(
    () => months.map((m) => ({ monthStr: m, record: buildMonthlyRecord(student.id, m, paymentsByMonth.get(m) ?? []) })),
    [months, student.id, paymentsByMonth]
  );

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptMonth, setReceiptMonth] = useState(monthStr);
  const [showPayForm, setShowPayForm] = useState(false);

  if (showReceipt) {
    const receiptRecord = buildMonthlyRecord(student.id, receiptMonth, paymentsByMonth.get(receiptMonth) ?? []);
    return <FeeReceipt record={receiptRecord} student={student} onClose={() => setShowReceipt(false)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Students
        </button>

        <div className="sm:ml-2 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(student.id)}`}>
            {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{student.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Class {student.classNum}-{student.section} · {student.rollNo}</p>
          </div>
        </div>

        <div className="sm:ml-auto flex gap-2">
          {record.status !== "paid" && (
            <FancyButton
              onClick={() => setShowPayForm((v) => !v)}
              size="xs"
            >
              <Plus className="h-3.5 w-3.5" /> Record Payment
            </FancyButton>
          )}
          {record.status === "paid" && (
            <button
              onClick={() => { setReceiptMonth(monthStr); setShowReceipt(true); }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-500/10 px-3 text-xs font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
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

      {showPayForm && (
        <RecordPaymentModal
          student={student}
          monthStr={monthStr}
          balance={record.balance}
          onClose={() => setShowPayForm(false)}
          onSaved={() => setShowPayForm(false)}
        />
      )}

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Fee Breakdown — {formatMonth(monthStr)}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        {record.lineItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No fee record for this month.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
              <tr>
                {["Category", "Monthly Amount", "Paid", "Balance"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {record.lineItems.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-zinc-700/20">
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
        )}

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

      <Table header={<TableTitleHeader title="Payment History" />}>
        <TableHead>
          <Th position="first">Month</Th>
          <Th>Amount Due</Th>
          <Th>Paid</Th>
          <Th>Balance</Th>
          <Th>Status</Th>
          <Th position="last">Receipt</Th>
        </TableHead>
        <TableBody>
          {history.map(({ monthStr: m, record: r }) => (
            <Tr key={m} className={m === monthStr ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}>
              <Td position="first" className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                {formatMonth(m)}
                {m === monthStr && <span className="ml-2 text-[10px] font-bold text-indigo-500">viewing</span>}
              </Td>
              <Td className="text-sm tabular-nums text-gray-600 dark:text-zinc-400">{formatCurrency(r.totalDue)}</Td>
              <Td className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(r.totalPaid)}</Td>
              <Td className={`text-sm font-semibold tabular-nums ${r.balance > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                {formatCurrency(r.balance)}
              </Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </Td>
              <Td position="last">
                {r.status === "paid" ? (
                  <button
                    onClick={() => { setReceiptMonth(m); setShowReceipt(true); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors"
                  >
                    <Printer className="h-3 w-3" /> Print
                  </button>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                )}
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Fee table (list view) ─────────────────────────────────────────────────────

function FeeTable({
  students, monthStr, paymentsByStudentMonth, onViewStudent,
}: {
  students: FeeStudent[];
  monthStr: string;
  paymentsByStudentMonth: Map<string, FeePaymentRow[]>;
  onViewStudent: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClass] = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);
  const records = useMemo(
    () => activeStudents.map((s) => ({ student: s, record: buildMonthlyRecord(s.id, monthStr, paymentsByStudentMonth.get(`${s.id}|${monthStr}`) ?? []) })),
    [activeStudents, monthStr, paymentsByStudentMonth]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(({ student, record }) => {
      const matchQ  = !q || student.name.toLowerCase().includes(q) || student.rollNo.includes(q) || student.parent.toLowerCase().includes(q);
      const matchCl = classFilter  === "all" || student.classNum === classFilter;
      const matchSt = statusFilter === "all" || record.status === statusFilter;
      return matchQ && matchCl && matchSt;
    });
  }, [records, query, classFilter, statusFilter]);

  const hasFilter = query || classFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, roll no or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...CLASS_NUMBERS].map((c) => (
            <button
              key={c}
              onClick={() => setClass(c)}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                classFilter === c
                  ? "bg-primary-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(["all", "paid", "partial", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary-500 text-white shadow-sm"
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
        {hasFilter && <span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">· Filters active</span>}
      </p>

      <Table>
        <TableHead>
          <Th position="first">Student</Th>
          <Th>Class</Th>
          <Th>Monthly Due</Th>
          <Th>Paid</Th>
          <Th>Balance</Th>
          <Th>Status</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={7} message="No students match this filter" />
          ) : filtered.map(({ student, record }) => (
            <Tr
              key={student.id}
              className={record.status === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}
            >
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(student.id)}`}>
                    {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{student.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{student.rollNo}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="inline-flex h-6 items-center justify-center rounded-md bg-primary-500/10 px-2 text-xs font-bold text-primary-600 dark:text-primary-400">
                  {student.classNum}-{student.section}
                </span>
              </Td>
              <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                {formatCurrency(record.totalDue)}
              </Td>
              <Td className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(record.totalPaid)}
              </Td>
              <Td className={`text-sm font-semibold tabular-nums ${record.balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                {formatCurrency(record.balance)}
              </Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
                  {STATUS_LABEL[record.status]}
                </span>
              </Td>
              <Td position="last" align="right">
                <button
                  onClick={() => onViewStudent(student.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors"
                >
                  View
                </button>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Fee structure management ──────────────────────────────────────────────────

const FREQUENCIES: FeeStructure["frequency"][] = ["monthly", "quarterly", "annual"];

interface StructureFormState {
  category: string;
  amount: string;
  gradeId: string; // "" = all grades
  frequency: FeeStructure["frequency"];
  isOptional: boolean;
}

const EMPTY_STRUCTURE_FORM: StructureFormState = {
  category: "", amount: "", gradeId: "", frequency: "monthly", isOptional: false,
};

function StructureRowForm({
  initial, grades, busy, onSave, onCancel,
}: {
  initial: StructureFormState;
  grades: GradeOption[];
  busy: boolean;
  onSave: (form: StructureFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<StructureFormState>(initial);

  return (
    <Tr className="bg-primary-50/40 dark:bg-primary-500/5">
      <Td position="first">
        <input
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="e.g. Tuition Fee"
          className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
      </Td>
      <Td>
        <div className="relative">
          <select
            value={form.gradeId}
            onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
            className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g.id} value={g.id}>Class {g.level}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </Td>
      <Td>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0"
          className="h-8 w-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
      </Td>
      <Td>
        <div className="relative">
          <select
            value={form.frequency}
            onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as FeeStructure["frequency"] }))}
            className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-sm capitalize text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </Td>
      <Td className="text-center">
        <input
          type="checkbox"
          checked={form.isOptional}
          onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-primary-500 cursor-pointer"
        />
      </Td>
      <Td position="last" align="right" className="whitespace-nowrap">
        <FancyButton
          onClick={() => onSave(form)}
          disabled={busy || !form.category.trim() || !form.amount}
          size="xs"
          className="mr-1.5"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </FancyButton>
        <button onClick={onCancel} className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors">
          Cancel
        </button>
      </Td>
    </Tr>
  );
}

function FeeStructurePanel({
  structures, grades, onBack,
}: {
  structures: FeeStructure[];
  grades: GradeOption[];
  onBack: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FeeStructure[]>(structures);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genError, setGenError] = useState("");

  function gradeLevelFor(gradeId: string): number | null {
    return gradeId ? grades.find((g) => g.id === gradeId)?.level ?? null : null;
  }

  async function handleCreate(form: StructureFormState) {
    setBusyId("new");
    setError("");
    try {
      const { id } = await createFeeStructure({
        category: form.category.trim(),
        amount: Number(form.amount),
        gradeId: form.gradeId || null,
        frequency: form.frequency,
        isOptional: form.isOptional,
      });
      setRows((prev) => [
        ...prev,
        { id, category: form.category.trim(), amount: Number(form.amount), gradeId: form.gradeId || null, gradeLevel: gradeLevelFor(form.gradeId), frequency: form.frequency, isOptional: form.isOptional },
      ]);
      setAdding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(id: string, form: StructureFormState) {
    setBusyId(id);
    setError("");
    try {
      await updateFeeStructure(id, {
        category: form.category.trim(),
        amount: Number(form.amount),
        gradeId: form.gradeId || null,
        frequency: form.frequency,
        isOptional: form.isOptional,
      });
      setRows((prev) => prev.map((r) => (r.id === id
        ? { ...r, category: form.category.trim(), amount: Number(form.amount), gradeId: form.gradeId || null, gradeLevel: gradeLevelFor(form.gradeId), frequency: form.frequency, isOptional: form.isOptional }
        : r)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError("");
    try {
      await deleteFeeStructure(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerate() {
    setGenBusy(true);
    setGenError("");
    setGenResult(null);
    try {
      const { created } = await generateMonthlyFees(month);
      setGenResult(
        created > 0
          ? `Generated ${created} fee record${created === 1 ? "" : "s"} for ${formatMonth(month)}.`
          : `All students already have fee records for ${formatMonth(month)}.`
      );
      router.refresh();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to generate fees");
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Fees
      </button>

      <Table
        header={
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Fee Structure</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">What&rsquo;s charged, per category, per grade.</p>
              </div>
              {!adding && (
                <FancyButton
                  onClick={() => setAdding(true)}
                  size="xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Category
                </FancyButton>
              )}
            </div>
            {error && <p className="px-4 pt-3 text-xs text-red-500">{error}</p>}
          </>
        }
      >
        <TableHead>
          <Th position="first">Category</Th>
          <Th>Grade</Th>
          <Th>Amount</Th>
          <Th>Frequency</Th>
          <Th>Optional</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {rows.length === 0 && !adding && (
            <TableEmptyRow colSpan={6} message="No fee categories configured yet. Add one to start generating monthly fees." />
          )}
          {rows.map((r) => editingId === r.id ? (
            <StructureRowForm
              key={r.id}
              initial={{ category: r.category, amount: String(r.amount), gradeId: r.gradeId ?? "", frequency: r.frequency, isOptional: r.isOptional }}
              grades={grades}
              busy={busyId === r.id}
              onSave={(form) => handleUpdate(r.id, form)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Tr key={r.id}>
              <Td position="first" className="text-sm font-medium text-gray-800 dark:text-zinc-200">{r.category}</Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400">{r.gradeLevel ? `Class ${r.gradeLevel}` : "All Grades"}</Td>
              <Td className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(r.amount)}</Td>
              <Td className="text-sm capitalize text-gray-600 dark:text-zinc-400">{r.frequency}</Td>
              <Td className="text-sm text-gray-500 dark:text-zinc-500">{r.isOptional ? "Optional" : "Required"}</Td>
              <Td position="last" align="right" className="whitespace-nowrap">
                <button onClick={() => setEditingId(r.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mr-1">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={busyId === r.id}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </Td>
            </Tr>
          ))}
          {adding && (
            <StructureRowForm
              initial={EMPTY_STRUCTURE_FORM}
              grades={grades}
              busy={busyId === "new"}
              onSave={handleCreate}
              onCancel={() => setAdding(false)}
            />
          )}
        </TableBody>
      </Table>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Generate Monthly Fees</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
          Creates fee records for every active student for the selected month, based on the categories above. Students who already have a record for a category are skipped.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={genBusy || rows.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors"
          >
            {genBusy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : "Generate Fees"}
          </button>
        </div>
        {genResult && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {genResult}</p>}
        {genError && <p className="mt-3 text-xs text-red-500">{genError}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function exportMonthCsv(monthStr: string, records: { student: FeeStudent; record: MonthlyFeeRecord }[]) {
  const header = ["Student", "Roll No", "Class", "Section", "Amount Due", "Amount Paid", "Balance", "Status"];
  const lines = records.map(({ student, record }) => [
    student.name, student.rollNo, student.classNum, student.section,
    record.totalDue, record.totalPaid, record.balance, STATUS_LABEL[record.status],
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fees-${monthStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FeesClient({
  students, payments, structures, grades,
}: {
  students: FeeStudent[];
  payments: FeePaymentRow[];
  structures: FeeStructure[];
  grades: GradeOption[];
}) {
  const months = useMemo(() => Array.from(new Set(payments.map((p) => p.monthStr))).sort(), [payments]);
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.length - 1));
  const [selectedStudentId, setStudent] = useState<string | null>(null);
  const [showStructure, setShowStructure] = useState(false);

  const paymentsByStudentMonth = useMemo(() => {
    const map = new Map<string, FeePaymentRow[]>();
    for (const p of payments) {
      const key = `${p.studentId}|${p.monthStr}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [payments]);

  const monthStr = months[monthIndex] ?? "";

  const monthRecords = useMemo(
    () => students.filter((s) => s.active).map((s) => buildMonthlyRecord(s.id, monthStr, paymentsByStudentMonth.get(`${s.id}|${monthStr}`) ?? [])),
    [students, monthStr, paymentsByStudentMonth]
  );

  const exportRecords = useMemo(
    () => students.filter((s) => s.active).map((s) => ({ student: s, record: buildMonthlyRecord(s.id, monthStr, paymentsByStudentMonth.get(`${s.id}|${monthStr}`) ?? []) })),
    [students, monthStr, paymentsByStudentMonth]
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;

  function handleMonthChange(i: number) {
    setMonthIndex(Math.max(0, Math.min(months.length - 1, i)));
    setStudent(null);
  }

  function openStructure() {
    setStudent(null);
    setShowStructure(true);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Fee Management</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track and collect student fees</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          {!showStructure && months.length > 0 && <MonthNav months={months} index={monthIndex} onChange={handleMonthChange} />}
          {!showStructure && months.length > 0 && (
            <button
              onClick={() => exportMonthCsv(monthStr, exportRecords)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          )}
          {!showStructure && (
            <button
              onClick={openStructure}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" /> Fee Structure
            </button>
          )}
        </div>
      </div>

      {showStructure ? (
        <FeeStructurePanel structures={structures} grades={grades} onBack={() => setShowStructure(false)} />
      ) : months.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <AlertCircle className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No fee records found yet.</p>
          <FancyButton
            onClick={openStructure}
            size="sm"
          >
            <Settings2 className="h-3.5 w-3.5" /> Set Up Fee Structure
          </FancyButton>
        </div>
      ) : (
        <>
          <StatsRow records={monthRecords} activeCount={students.filter((s) => s.active).length} />

          {selectedStudent ? (
            <StudentFeeDetail
              student={selectedStudent}
              months={months}
              monthStr={monthStr}
              paymentsByMonth={new Map(months.map((m) => [m, paymentsByStudentMonth.get(`${selectedStudent.id}|${m}`) ?? []]))}
              onBack={() => setStudent(null)}
            />
          ) : (
            <FeeTable
              students={students}
              monthStr={monthStr}
              paymentsByStudentMonth={paymentsByStudentMonth}
              onViewStudent={(id) => setStudent(id)}
            />
          )}
        </>
      )}
    </div>
  );
}
