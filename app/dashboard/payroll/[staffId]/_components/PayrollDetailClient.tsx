"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, Printer, CheckCircle2, ArrowLeft } from "lucide-react";
import { StaffPayDetail, PaySlip } from "../../_components/StaffPayDetail";
import { processSalary } from "../../actions";
import type { PayrollStaff, PayrollRecord } from "../../_data/payroll";

export default function PayrollDetailClient({
  staff, records, initialMonth,
}: {
  staff: PayrollStaff;
  records: PayrollRecord[];
  initialMonth?: string;
}) {
  const router = useRouter();
  const months = useMemo(() => Array.from(new Set(records.map((r) => r.monthStr))).sort(), [records]);

  const recordsByMonth = useMemo(() => {
    const map = new Map<string, PayrollRecord>();
    for (const r of records) map.set(r.monthStr, r);
    return map;
  }, [records]);

  const monthStr = (initialMonth && months.includes(initialMonth)) ? initialMonth : months[months.length - 1] ?? "";
  const record = recordsByMonth.get(monthStr);

  const [printMonth, setPrintMonth] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleProcess() {
    setError("");
    startTransition(async () => {
      try {
        await processSalary(staff.id, monthStr, new Date().toISOString().slice(0, 10), "bank_transfer");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process salary.");
      }
    });
  }

  if (months.length === 0) {
    return (
      <div className="w-full px-6 py-6 space-y-5">
        <Link href="/dashboard/payroll" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Staff
        </Link>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <Wallet className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No payroll records found for {staff.name}.</p>
        </div>
      </div>
    );
  }

  if (printMonth) {
    const slipRecord = recordsByMonth.get(printMonth);
    if (slipRecord) {
      return (
        <div className="w-full px-6 py-6 print:bg-white! print:p-0!">
          <style>{`@media print { html, body, .dashboard-shell { background: #fff !important; } }`}</style>
          <PaySlip staff={staff} record={slipRecord} onClose={() => setPrintMonth(null)} autoPrint />
        </div>
      );
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <Link href="/dashboard/payroll" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <ArrowLeft className="h-4 w-4" /> All Staff
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Payroll Details</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{staff.name} · {staff.employeeId}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          {record?.status === "processed" && (
            <button
              onClick={() => setPrintMonth(monthStr)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-500/10 px-3 text-sm font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Pay Slip
            </button>
          )}
          {record?.status === "pending" && (
            <button onClick={handleProcess} disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-3 text-sm font-medium text-white transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5" /> {isPending ? "Processing…" : "Process Salary"}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <StaffPayDetail
        staff={staff}
        months={months}
        monthStr={monthStr}
        recordsByMonth={recordsByMonth}
        onBack={() => router.push("/dashboard/payroll")}
        backLabel="All Staff"
        onPrintMonth={setPrintMonth}
      />
    </div>
  );
}
