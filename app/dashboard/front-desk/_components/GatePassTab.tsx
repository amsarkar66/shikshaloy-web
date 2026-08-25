"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2, DoorOpen, Search, X } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addGatePass, searchStudentsForGatePass } from "../actions";
import type { GatePassEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

interface GatePassInput { studentId: string; studentLabel: string; studentSublabel: string; reason: string; pickupPersonName: string; pickupPersonRelation: string }

function IssueGatePassModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: GatePassInput) => Promise<boolean> }) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !reason.trim() || !pickupPersonName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAdd({
        studentId: selectedStudent.id, studentLabel: selectedStudent.label, studentSublabel: selectedStudent.sublabel,
        reason, pickupPersonName, pickupPersonRelation,
      });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue gate pass");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Issue Gate Pass</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Student</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <input
                className={`${inputClass} pl-8`}
                value={studentQuery}
                onChange={(e) => { setStudentQuery(e.target.value); setSelectedStudent(null); }}
                placeholder="Search by name"
                autoFocus
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Pickup Person</label>
              <input className={inputClass} value={pickupPersonName} onChange={(e) => setPickupPersonName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Relation</label>
              <input className={inputClass} value={pickupPersonRelation} onChange={(e) => setPickupPersonRelation(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy || !selectedStudent || !reason.trim() || !pickupPersonName.trim()} size="sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Issue
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GatePassTab({ initialGatePasses }: { initialGatePasses: GatePassEntry[] }) {
  const [passes, setPasses] = useState(initialGatePasses);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return passes;
    return passes.filter((p) =>
      p.studentName.toLowerCase().includes(q) ||
      p.studentRollNo.toLowerCase().includes(q) ||
      p.pickupPersonName.toLowerCase().includes(q)
    );
  }, [passes, search]);

  async function handleAdd(input: GatePassInput) {
    await addGatePass({ studentId: input.studentId, reason: input.reason, pickupPersonName: input.pickupPersonName, pickupPersonRelation: input.pickupPersonRelation });
    setPasses((prev) => [
      {
        id: crypto.randomUUID(), studentName: input.studentLabel, studentRollNo: input.studentSublabel,
        reason: input.reason, pickupPersonName: input.pickupPersonName, pickupPersonRelation: input.pickupPersonRelation || null, passTime: new Date().toISOString(),
      },
      ...prev,
    ]);
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, pickup person..." />
        </div>
        <FancyButton onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Issue Gate Pass
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <DoorOpen className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">{passes.length === 0 ? "No gate passes issued yet" : "No gate passes match your search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((p) => (
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

      {showModal && <IssueGatePassModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
