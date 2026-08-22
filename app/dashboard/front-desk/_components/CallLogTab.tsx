"use client";

import { useState } from "react";
import { Plus, Loader2, Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addCallLog } from "../actions";
import type { CallLogEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function CallLogTab({ initialCalls }: { initialCalls: CallLogEntry[] }) {
  const [calls, setCalls] = useState(initialCalls);
  const [callerName, setCallerName] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState<CallLogEntry["direction"]>("incoming");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!callerName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addCallLog({ callerName, phone, direction, purpose, notes });
      setCalls((prev) => [
        { id: crypto.randomUUID(), callerName, phone: phone || null, direction, purpose: purpose || null, notes: notes || null, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setCallerName(""); setPhone(""); setDirection("incoming"); setPurpose(""); setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add call log");
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
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Caller Name</label>
            <input className={inputClass} value={callerName} onChange={(e) => setCallerName(e.target.value)} placeholder="Full name" />
          </div>
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Purpose</label>
            <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Optional" />
          </div>
          <FancyButton onClick={handleAdd} disabled={busy || !callerName.trim()} size="sm" className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Call
          </FancyButton>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Notes</label>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Phone className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No calls logged yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {calls.map((c) => (
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
    </div>
  );
}
