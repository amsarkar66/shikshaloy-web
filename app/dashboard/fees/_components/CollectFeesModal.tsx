"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, PartyPopper } from "lucide-react";
import {
  formatCurrency, avatarColor,
  buildMonthlyRecord,
  type FeeStudent, type FeePaymentRow,
} from "../_data/fees";
import { StudentCollectPanel } from "./FeeCollectClient";

export default function CollectFeesModal({
  students, payments, onClose,
}: {
  students: FeeStudent[];
  payments: FeePaymentRow[];
  onClose: () => void;
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

  // Students with any unpaid balance, surfaced below the search bar as
  // one-click shortcuts so a front-desk staffer doesn't have to know a name
  // to start collecting — the common case is working down the overdue list.
  const overdueStudents = useMemo(() => {
    if (selectedStudent || query.trim()) return [];
    return activeStudents
      .map((s) => ({
        student: s,
        balance: months.reduce((sum, m) => sum + buildMonthlyRecord(s.id, m, paymentsByStudentMonth.get(`${s.id}|${m}`) ?? []).balance, 0),
      }))
      .filter((r) => r.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);
  }, [activeStudents, months, paymentsByStudentMonth, selectedStudent, query]);

  useEffect(() => {
    if (!selectedStudent) searchRef.current?.focus();
  }, [selectedStudent]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pickStudent(id: string) {
    setSelectedStudentId(id);
    setQuery("");
  }

  function reset() {
    setSelectedStudentId(null);
    setQuery("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Collect Fees</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Search a student, record the payment, move to the next.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {!selectedStudent ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student by name, roll no or parent…"
                  className="h-11 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {query.trim() ? (
                <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700/50">
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
              ) : (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">Top Outstanding Dues</p>
                  {overdueStudents.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-500/5 py-10">
                      <PartyPopper className="h-5 w-5 text-emerald-500" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No outstanding dues</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700/50">
                      {overdueStudents.map(({ student: s, balance }) => (
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
                          <p className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">{formatCurrency(balance)}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <StudentCollectPanel
              student={selectedStudent}
              outstanding={outstanding}
              onDone={() => { router.refresh(); reset(); }}
              onChangeStudent={reset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
