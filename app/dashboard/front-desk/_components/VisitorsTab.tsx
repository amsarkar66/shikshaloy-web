"use client";

import { useState } from "react";
import { Plus, Loader2, LogOut, Users } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addVisitor, checkOutVisitor } from "../actions";
import type { VisitorEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function VisitorsTab({ initialVisitors }: { initialVisitors: VisitorEntry[] }) {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [meetingWith, setMeetingWith] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!visitorName.trim() || !purpose.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addVisitor({ visitorName, phone, purpose, meetingWith });
      setVisitors((prev) => [
        { id: crypto.randomUUID(), visitorName, phone: phone || null, purpose, meetingWith: meetingWith || null, inTime: new Date().toISOString(), outTime: null },
        ...prev,
      ]);
      setVisitorName(""); setPhone(""); setPurpose(""); setMeetingWith("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add visitor");
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut(id: string) {
    setRowBusyId(id);
    setError(null);
    try {
      await checkOutVisitor(id);
      setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, outTime: new Date().toISOString() } : v)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check out visitor");
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Visitor Name</label>
            <input className={inputClass} value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Purpose</label>
            <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Admission enquiry" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Meeting With</label>
            <input className={inputClass} value={meetingWith} onChange={(e) => setMeetingWith(e.target.value)} placeholder="Optional" />
          </div>
          <FancyButton onClick={handleAdd} disabled={busy || !visitorName.trim() || !purpose.trim()} size="sm" className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Visitor
          </FancyButton>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {visitors.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No visitors logged yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {visitors.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{v.visitorName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {v.purpose}{v.meetingWith ? ` · Meeting ${v.meetingWith}` : ""}{v.phone ? ` · ${v.phone}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">In {formatTime(v.inTime)}</p>
                  {v.outTime && <p className="text-xs text-gray-400 dark:text-zinc-500">Out {formatTime(v.outTime)}</p>}
                </div>
                {!v.outTime && (
                  <button
                    onClick={() => handleCheckOut(v.id)}
                    disabled={rowBusyId === v.id}
                    className="flex items-center gap-1.5 h-8 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    {rowBusyId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />} Check Out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
