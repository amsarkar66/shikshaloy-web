"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, HelpCircle, X, Search } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addEnquiry, updateEnquiryStatus } from "../actions";
import type { EnquiryEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type StatusFilter = "all" | EnquiryEntry["status"];

const STATUS_STYLE: Record<EnquiryEntry["status"], string> = {
  new:       "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  closed:    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface EnquiryInput { name: string; phone: string; email: string; interestedGrade: string; source: string; notes: string }

function LogEnquiryModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: EnquiryInput) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interestedGrade, setInterestedGrade] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAdd({ name, phone, email, interestedGrade, source, notes });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add enquiry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Log Enquiry</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent / guardian name" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Email</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Interested Grade</label>
              <input className={inputClass} value={interestedGrade} onChange={(e) => setInterestedGrade(e.target.value)} placeholder="e.g. Class 6" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Source</label>
              <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Walk-in, Referral" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Notes</label>
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy || !name.trim()} size="sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Enquiry
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EnquiriesTab({ initialEnquiries }: { initialEnquiries: EnquiryEntry[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [showModal, setShowModal] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.phone ?? "").toLowerCase().includes(q) ||
        (e.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [enquiries, search, statusFilter]);

  async function handleAdd(input: EnquiryInput) {
    await addEnquiry(input);
    setEnquiries((prev) => [
      {
        id: crypto.randomUUID(), name: input.name, phone: input.phone || null, email: input.email || null,
        interestedGrade: input.interestedGrade || null, source: input.source || null, notes: input.notes || null,
        status: "new", createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    return true;
  }

  async function handleStatusChange(id: string, status: EnquiryEntry["status"]) {
    setRowBusyId(id);
    setError(null);
    try {
      await updateEnquiryStatus(id, status);
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
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
          <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
        <FancyButton onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Log Enquiry
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <HelpCircle className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">{enquiries.length === 0 ? "No enquiries logged yet" : "No enquiries match your search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{e.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {[e.interestedGrade, e.phone, e.source].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{formatDate(e.createdAt)}</p>
                <div className="relative shrink-0">
                  <select
                    value={e.status}
                    disabled={rowBusyId === e.id}
                    onChange={(ev) => handleStatusChange(e.id, ev.target.value as EnquiryEntry["status"])}
                    className={`h-7 appearance-none rounded-full border px-2.5 text-center text-[11px] font-medium outline-none disabled:opacity-50 ${STATUS_STYLE[e.status]}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <LogEnquiryModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
