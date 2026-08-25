"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, Phone, PhoneIncoming, PhoneOutgoing, X, Search } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addCallLog } from "../actions";
import type { CallLogEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const filterSelectClass =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type DirectionFilter = "all" | CallLogEntry["direction"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

interface CallInput { callerName: string; phone: string; direction: CallLogEntry["direction"]; purpose: string; notes: string }

function LogCallModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: CallInput) => Promise<boolean> }) {
  const [callerName, setCallerName] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState<CallLogEntry["direction"]>("incoming");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!callerName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAdd({ callerName, phone, direction, purpose, notes });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add call log");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Log Call</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Caller Name</label>
            <input className={inputClass} value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="Full name" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as CallLogEntry["direction"])} className={selectClass}>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Purpose</label>
            <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Notes</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy || !callerName.trim()} size="sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Call
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CallLogTab({ initialCalls }: { initialCalls: CallLogEntry[] }) {
  const [calls, setCalls] = useState(initialCalls);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return calls.filter((c) => {
      if (directionFilter !== "all" && c.direction !== directionFilter) return false;
      if (!q) return true;
      return (
        c.callerName.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.purpose ?? "").toLowerCase().includes(q)
      );
    });
  }, [calls, search, directionFilter]);

  async function handleAdd(input: CallInput) {
    await addCallLog(input);
    setCalls((prev) => [
      { id: crypto.randomUUID(), callerName: input.callerName, phone: input.phone || null, direction: input.direction, purpose: input.purpose || null, notes: input.notes || null, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search caller, phone, purpose..." />
        </div>
        <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)} className={filterSelectClass}>
          <option value="all">All</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
        <FancyButton onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Log Call
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Phone className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">{calls.length === 0 ? "No calls logged yet" : "No calls match your search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.direction === "incoming" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                  {c.direction === "incoming" ? <PhoneIncoming className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{c.callerName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {[c.phone, c.purpose].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{formatDateTime(c.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <LogCallModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
