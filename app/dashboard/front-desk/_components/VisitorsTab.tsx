"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, LogOut, Users, X, Search } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addVisitor, checkOutVisitor } from "../actions";
import type { VisitorEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type StatusFilter = "all" | "in" | "out";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function LogVisitorModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: { visitorName: string; phone: string; purpose: string; meetingWith: string }) => Promise<boolean> }) {
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [meetingWith, setMeetingWith] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitorName.trim() || !purpose.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAdd({ visitorName, phone, purpose, meetingWith });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add visitor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Log Visitor</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Visitor Name</label>
            <input className={inputClass} value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Full name" autoFocus />
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
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy || !visitorName.trim() || !purpose.trim()} size="sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Visitor
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VisitorsTab({ initialVisitors }: { initialVisitors: VisitorEntry[] }) {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [showModal, setShowModal] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visitors.filter((v) => {
      if (statusFilter === "in" && v.outTime) return false;
      if (statusFilter === "out" && !v.outTime) return false;
      if (!q) return true;
      return (
        v.visitorName.toLowerCase().includes(q) ||
        (v.phone ?? "").toLowerCase().includes(q) ||
        v.purpose.toLowerCase().includes(q) ||
        (v.meetingWith ?? "").toLowerCase().includes(q)
      );
    });
  }, [visitors, search, statusFilter]);

  async function handleAdd(input: { visitorName: string; phone: string; purpose: string; meetingWith: string }) {
    await addVisitor(input);
    setVisitors((prev) => [
      { id: crypto.randomUUID(), visitorName: input.visitorName, phone: input.phone || null, purpose: input.purpose, meetingWith: input.meetingWith || null, inTime: new Date().toISOString(), outTime: null },
      ...prev,
    ]);
    return true;
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
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, purpose..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">All</option>
          <option value="in">Checked In</option>
          <option value="out">Checked Out</option>
        </select>
        <FancyButton onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Log Visitor
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">{visitors.length === 0 ? "No visitors logged yet" : "No visitors match your search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((v) => (
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

      {showModal && <LogVisitorModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
