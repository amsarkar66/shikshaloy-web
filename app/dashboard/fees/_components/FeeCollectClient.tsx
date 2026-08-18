"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, X, ChevronDown, CheckCircle2, Phone, PartyPopper,
} from "lucide-react";
import {
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, avatarColor,
  buildMonthlyRecord,
  type FeeStudent, type FeePaymentRow, type PaymentMode,
} from "../_data/fees";
import { recordFeePayment } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";

interface RecentEntry {
  key: string;
  studentName: string;
  monthStr: string;
  amount: number;
}

export default function FeeCollectClient({
  students, payments, backHref,
}: {
  students: FeeStudent[];
  payments: FeePaymentRow[];
  backHref: string;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);
  const months = useMemo(() => Array.from(new Set(payments.map((p) => p.monthStr))).sort(), [payments]);
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

  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId) ?? null;

  const results = useMemo(() => {
    if (!query.trim() || selectedStudent) return [];
    const q = query.toLowerCase();
    return activeStudents
      .filter((s) => s.name.toLowerCase().includes(q) || s.rollNo.includes(q) || s.parent.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, activeStudents, selectedStudent]);

  const outstanding = useMemo(() => {
    if (!selectedStudent) return [];
    return months
      .map((m) => buildMonthlyRecord(selectedStudent.id, m, paymentsByStudentMonth.get(`${selectedStudent.id}|${m}`) ?? []))
      .filter((r) => r.balance > 0)
      .sort((a, b) => a.monthStr.localeCompare(b.monthStr));
  }, [selectedStudent, months, paymentsByStudentMonth]);

  useEffect(() => {
    if (!selectedStudent) searchRef.current?.focus();
  }, [selectedStudent]);

  function pickStudent(id: string) {
    setSelectedStudentId(id);
    setQuery("");
  }

  function reset() {
    setSelectedStudentId(null);
    setQuery("");
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Fees
      </Link>

      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Collect Fees</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Search a student, record the payment, move to the next.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {!selectedStudent ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search student by name, roll no or parent…"
                className="h-11 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />

              {query.trim() && (
                <div className="mt-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {results.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">No matching students</p>
                  ) : results.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => pickStudent(s.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/40 transition-colors"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(s.id)}`}>
                        {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">Class {s.classNum}-{s.section} · {s.rollNo}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <StudentCollectPanel
              student={selectedStudent}
              outstanding={outstanding}
              onDone={(entry) => {
                setRecent((prev) => [entry, ...prev].slice(0, 8));
                router.refresh();
                reset();
              }}
              onChangeStudent={reset}
            />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Collected this session</p>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">Nothing collected yet</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {recent.map((r) => (
                <div key={r.key} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{r.studentName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{formatMonth(r.monthStr)}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(r.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentCollectPanel({
  student, outstanding, onDone, onChangeStudent,
}: {
  student: FeeStudent;
  outstanding: ReturnType<typeof buildMonthlyRecord>[];
  onDone: (entry: RecentEntry) => void;
  onChangeStudent: () => void;
}) {
  const [monthStr, setMonthStr] = useState(outstanding[0]?.monthStr ?? "");
  const activeRecord = outstanding.find((r) => r.monthStr === monthStr) ?? outstanding[0] ?? null;

  const [amount, setAmount] = useState(String(activeRecord?.balance ?? ""));
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<PaymentMode>("online");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function selectMonth(m: string) {
    setMonthStr(m);
    const r = outstanding.find((o) => o.monthStr === m);
    setAmount(String(r?.balance ?? ""));
    setError("");
  }

  function handleSubmit() {
    if (!activeRecord) return;
    setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    startTransition(async () => {
      try {
        await recordFeePayment(student.id, activeRecord.monthStr, amt, paidDate, mode);
        onDone({ key: `${student.id}|${activeRecord.monthStr}|${Date.now()}`, studentName: student.name, monthStr: activeRecord.monthStr, amount: amt });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record payment.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(student.id)}`}>
          {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{student.name}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Class {student.classNum}-{student.section} · {student.rollNo} · {student.parent}</p>
        </div>
        <a
          href={`tel:${student.phone}`}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Phone className="h-3.5 w-3.5" /> Call
        </a>
        <button
          onClick={onChangeStudent}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          title="Search another student"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {outstanding.length === 0 || !activeRecord ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/5 py-12">
          <PartyPopper className="h-6 w-6 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No outstanding fees for this student</p>
          <button onClick={onChangeStudent} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            Search another student
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-zinc-400">Outstanding months</label>
            <div className="flex flex-wrap gap-1.5">
              {outstanding.map((r) => (
                <button
                  key={r.monthStr}
                  onClick={() => selectMonth(r.monthStr)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs font-medium transition-colors ${
                    r.monthStr === monthStr
                      ? "bg-primary-500 text-white shadow-sm"
                      : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {formatMonth(r.monthStr)}
                  <span className="opacity-75">{formatCurrency(r.balance)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 px-3 py-2 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-zinc-400">
              Balance for <span className="font-medium text-gray-700 dark:text-zinc-300">{formatMonth(activeRecord.monthStr)}</span>
            </span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[activeRecord.status]}`}>
              {STATUS_LABEL[activeRecord.status]}
            </span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatCurrency(activeRecord.balance)}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-base font-semibold text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
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

          <FancyButton
            onClick={handleSubmit}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            {isPending ? "Saving…" : "Record Payment"}
          </FancyButton>
        </div>
      )}
    </div>
  );
}
