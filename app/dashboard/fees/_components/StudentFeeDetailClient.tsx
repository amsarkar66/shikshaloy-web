"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Printer, Phone, Plus, Receipt, X, ChevronDown,
} from "lucide-react";
import {
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, formatDate, avatarColor,
  buildMonthlyRecord,
  type FeeStudent, type FeePaymentRow, type MonthlyFeeRecord, type PaymentMode,
} from "../_data/fees";
import { recordFeePayment } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableTitleHeader } from "@/components/ui/data-table";
import { MonthNav } from "./FeesClient";

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

// ── Student fee detail (page) ───────────────────────────────────────────────

export default function StudentFeeDetailClient({
  student, months, initialMonthStr, paymentsByMonth, backHref,
}: {
  student: FeeStudent;
  months: string[];
  initialMonthStr: string;
  paymentsByMonth: Map<string, FeePaymentRow[]>;
  backHref: string;
}) {
  const router = useRouter();
  const [monthIndex, setMonthIndex] = useState(() => Math.max(0, months.indexOf(initialMonthStr)));
  const monthStr = months[monthIndex] ?? initialMonthStr;

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
    <div className="w-full px-6 py-6 space-y-5">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> All Students
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(student.id)}`}>
            {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{student.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Class {student.classNum}-{student.section} · {student.rollNo}</p>
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <MonthNav months={months} index={monthIndex} onChange={setMonthIndex} />
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
          onSaved={() => { setShowPayForm(false); router.refresh(); }}
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

      <Table header={<TableTitleHeader title="Payment History" subtitle="Click a month to view its breakdown above" />}>
        <TableHead>
          <Th position="first">Month</Th>
          <Th>Amount Due</Th>
          <Th>Paid</Th>
          <Th>Balance</Th>
          <Th>Status</Th>
          <Th position="last">Receipt</Th>
        </TableHead>
        <TableBody>
          {history.map(({ monthStr: m, record: r }, i) => (
            <Tr
              key={m}
              onClick={() => setMonthIndex(i)}
              className={m === monthStr ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}
            >
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
                    onClick={(e) => { e.stopPropagation(); setReceiptMonth(m); setShowReceipt(true); }}
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
