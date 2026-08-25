"use client";

import { useMemo, useState } from "react";
import { Plus, Loader2, Mail, ArrowDownToLine, ArrowUpFromLine, X, Search } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addPostalRecord } from "../actions";
import type { PostalEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const filterSelectClass =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type DirectionFilter = "all" | PostalEntry["direction"];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

interface PostalInput { direction: PostalEntry["direction"]; referenceNo: string; subject: string; contactName: string; notes: string }

function AddPostalRecordModal({ onClose, onAdd }: { onClose: () => void; onAdd: (input: PostalInput) => Promise<boolean> }) {
  const [direction, setDirection] = useState<PostalEntry["direction"]>("dispatch");
  const [referenceNo, setReferenceNo] = useState("");
  const [subject, setSubject] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await onAdd({ direction, referenceNo, subject, contactName, notes });
      if (ok) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add postal record");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Add Postal Record</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value as PostalEntry["direction"])} className={selectClass}>
                <option value="dispatch">Dispatch</option>
                <option value="receive">Receive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Reference No.</label>
              <input className={inputClass} value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Subject</label>
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is it" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">{direction === "dispatch" ? "To" : "From"}</label>
            <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Notes</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy || !subject.trim()} size="sm">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Record
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostalTab({ initialPostal }: { initialPostal: PostalEntry[] }) {
  const [records, setRecords] = useState(initialPostal);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (directionFilter !== "all" && r.direction !== directionFilter) return false;
      if (!q) return true;
      return (
        r.subject.toLowerCase().includes(q) ||
        (r.referenceNo ?? "").toLowerCase().includes(q) ||
        (r.contactName ?? "").toLowerCase().includes(q)
      );
    });
  }, [records, search, directionFilter]);

  async function handleAdd(input: PostalInput) {
    await addPostalRecord(input);
    setRecords((prev) => [
      {
        id: crypto.randomUUID(), direction: input.direction, referenceNo: input.referenceNo || null, subject: input.subject,
        contactName: input.contactName || null, recordDate: new Date().toISOString().slice(0, 10), notes: input.notes || null,
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
          <input className={`${inputClass} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, reference, contact..." />
        </div>
        <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)} className={filterSelectClass}>
          <option value="all">All</option>
          <option value="dispatch">Dispatch</option>
          <option value="receive">Receive</option>
        </select>
        <FancyButton onClick={() => setShowModal(true)} size="sm">
          <Plus className="h-4 w-4" /> Add Record
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Mail className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">{records.length === 0 ? "No postal records yet" : "No records match your search"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${r.direction === "dispatch" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                  {r.direction === "dispatch" ? <ArrowUpFromLine className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{r.subject}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {[r.referenceNo, r.contactName].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{formatDate(r.recordDate)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && <AddPostalRecordModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
