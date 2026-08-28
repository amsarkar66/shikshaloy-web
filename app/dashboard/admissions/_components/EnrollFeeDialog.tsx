"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Banknote, ChevronDown } from "lucide-react";
import { getFeeStructuresForGrade, type FeeStructureLookup } from "../../fees/actions";
import { formatCurrency, type PaymentMode } from "../../fees/_data/fees";

// Shown when an admin/authorised staffer clicks "Enroll Student" — surfaces
// the admission fee (and the course fee it'll bill going forward) for that
// grade before the student record is even created, and lets the desk collect
// a full, partial, or zero payment right there rather than always leaving it
// overdue for a separate Collect Fees trip later.
export function EnrollFeeDialog({
  applicantName, applyingForGrade, academicYearId, busy, error, onCancel, onConfirm,
}: {
  applicantName: string;
  applyingForGrade: string;
  academicYearId: string;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (collectedAmount: number, paymentMode: PaymentMode) => void;
}) {
  const [data, setData] = useState<FeeStructureLookup | null>(null);
  const [amount, setAmount] = useState("0");
  const [mode, setMode] = useState<PaymentMode>("cash");

  useEffect(() => {
    let cancelled = false;
    getFeeStructuresForGrade(academicYearId, Number(applyingForGrade)).then((res) => {
      if (cancelled) return;
      setData(res);
      setAmount(String(res.oneTime.reduce((s, r) => s + r.amount, 0)));
    });
    return () => { cancelled = true; };
  }, [academicYearId, applyingForGrade]);

  const admissionTotal = useMemo(() => data?.oneTime.reduce((s, r) => s + r.amount, 0) ?? 0, [data]);
  const amountNum = Math.min(Math.max(Number(amount) || 0, 0), admissionTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Enroll {applicantName}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Review the fees for this class, and collect the admission fee now if you&apos;re taking payment.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!data ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" /></div>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">Admission fee — Class {applyingForGrade}</p>
                {data.oneTime.length === 0 ? (
                  <p className="text-sm italic text-gray-400 dark:text-zinc-500">No admission fee configured for this class.</p>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700/50">
                    {data.oneTime.map((r) => (
                      <div key={r.category} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">{r.category}</span>
                        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(r.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {data.recurring.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">Course fee — bills going forward</p>
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700/50">
                    {data.recurring.map((r) => (
                      <div key={r.category} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">{r.category}</span>
                        <span className="font-medium tabular-nums text-gray-900 dark:text-zinc-100">
                          {formatCurrency(r.amount)} <span className="font-normal text-gray-400 dark:text-zinc-500">/{r.frequency}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {admissionTotal > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount to collect now (₹)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={0}
                        max={admissionTotal}
                        className="h-10 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-semibold text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Payment mode</label>
                      <div className="relative">
                        <select
                          value={mode}
                          onChange={(e) => setMode(e.target.value as PaymentMode)}
                          className="h-10 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                        >
                          <option value="cash">Cash</option>
                          <option value="online">Online Transfer</option>
                          <option value="upi">UPI</option>
                          <option value="cheque">Cheque</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {amountNum === 0
                      ? "No payment will be collected — the admission fee stays outstanding."
                      : amountNum < admissionTotal
                        ? `₹${(admissionTotal - amountNum).toLocaleString("en-IN")} will remain outstanding.`
                        : "Admission fee will be marked fully paid."}
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {error && <p className="px-5 pb-3 text-xs text-red-500">{error}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button onClick={onCancel} disabled={busy} className="flex h-9 items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(amountNum, mode)}
            disabled={busy || !data}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
            {busy ? "Enrolling…" : amountNum > 0 ? `Collect ${formatCurrency(amountNum)} & Enroll` : "Enroll Student"}
          </button>
        </div>
      </div>
    </div>
  );
}
