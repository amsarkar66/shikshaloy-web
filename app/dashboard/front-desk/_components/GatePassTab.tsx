"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Loader2, DoorOpen, Search } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addGatePass, searchStudentsForGatePass } from "../actions";
import type { GatePassEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function GatePassTab({ initialGatePasses }: { initialGatePasses: GatePassEntry[] }) {
  const [passes, setPasses] = useState(initialGatePasses);
  const [studentQuery, setStudentQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; label: string; sublabel: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; label: string; sublabel: string } | null>(null);
  const [reason, setReason] = useState("");
  const [pickupPersonName, setPickupPersonName] = useState("");
  const [pickupPersonRelation, setPickupPersonRelation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedStudent && studentQuery === selectedStudent.label) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (studentQuery.trim().length < 2) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      const results = await searchStudentsForGatePass(studentQuery);
      setSuggestions(results);
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [studentQuery, selectedStudent]);

  function pickStudent(s: { id: string; label: string; sublabel: string }) {
    setSelectedStudent(s);
    setStudentQuery(s.label);
    setSuggestions([]);
  }

  async function handleAdd() {
    if (!selectedStudent || !reason.trim() || !pickupPersonName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addGatePass({ studentId: selectedStudent.id, reason, pickupPersonName, pickupPersonRelation });
      setPasses((prev) => [
        {
          id: crypto.randomUUID(), studentName: selectedStudent.label, studentRollNo: selectedStudent.sublabel,
          reason, pickupPersonName, pickupPersonRelation: pickupPersonRelation || null, passTime: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSelectedStudent(null); setStudentQuery(""); setReason(""); setPickupPersonName(""); setPickupPersonRelation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue gate pass");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Student</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <input
                className={`${inputClass} pl-8`}
                value={studentQuery}
                onChange={(e) => { setStudentQuery(e.target.value); setSelectedStudent(null); }}
                placeholder="Search by name"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickStudent(s)}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <span className="text-sm text-gray-900 dark:text-zinc-100">{s.label}</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">{s.sublabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Reason</label>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Medical appointment" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Pickup Person</label>
            <input className={inputClass} value={pickupPersonName} onChange={(e) => setPickupPersonName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Relation</label>
              <input className={inputClass} value={pickupPersonRelation} onChange={(e) => setPickupPersonRelation(e.target.value)} placeholder="Optional" />
            </div>
            <FancyButton onClick={handleAdd} disabled={busy || !selectedStudent || !reason.trim() || !pickupPersonName.trim()} size="sm" className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Issue
            </FancyButton>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {passes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <DoorOpen className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No gate passes issued yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {passes.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{p.studentName} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">{p.studentRollNo}</span></p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {p.reason} · Picked up by {p.pickupPersonName}{p.pickupPersonRelation ? ` (${p.pickupPersonRelation})` : ""}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{formatTime(p.passTime)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
