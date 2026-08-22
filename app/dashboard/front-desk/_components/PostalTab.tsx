"use client";

import { useState } from "react";
import { Plus, Loader2, Mail, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addPostalRecord } from "../actions";
import type { PostalEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function PostalTab({ initialPostal }: { initialPostal: PostalEntry[] }) {
  const [records, setRecords] = useState(initialPostal);
  const [direction, setDirection] = useState<PostalEntry["direction"]>("dispatch");
  const [referenceNo, setReferenceNo] = useState("");
  const [subject, setSubject] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!subject.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addPostalRecord({ direction, referenceNo, subject, contactName, notes });
      setRecords((prev) => [
        {
          id: crypto.randomUUID(), direction, referenceNo: referenceNo || null, subject,
          contactName: contactName || null, recordDate: new Date().toISOString().slice(0, 10), notes: notes || null,
        },
        ...prev,
      ]);
      setDirection("dispatch"); setReferenceNo(""); setSubject(""); setContactName(""); setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add postal record");
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
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Subject</label>
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What is it" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">{direction === "dispatch" ? "To" : "From"}</label>
            <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optional" />
          </div>
          <FancyButton onClick={handleAdd} disabled={busy || !subject.trim()} size="sm" className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Record
          </FancyButton>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Notes</label>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Mail className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No postal records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {records.map((r) => (
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
    </div>
  );
}
