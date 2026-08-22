"use client";

import { useState } from "react";
import { Plus, Loader2, HelpCircle } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addEnquiry, updateEnquiryStatus } from "../actions";
import type { EnquiryEntry } from "./FrontDeskClient";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const STATUS_STYLE: Record<EnquiryEntry["status"], string> = {
  new:       "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  closed:    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function EnquiriesTab({ initialEnquiries }: { initialEnquiries: EnquiryEntry[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interestedGrade, setInterestedGrade] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addEnquiry({ name, phone, email, interestedGrade, source, notes });
      setEnquiries((prev) => [
        {
          id: crypto.randomUUID(), name, phone: phone || null, email: email || null,
          interestedGrade: interestedGrade || null, source: source || null, notes: notes || null,
          status: "new", createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setName(""); setPhone(""); setEmail(""); setInterestedGrade(""); setSource(""); setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add enquiry");
    } finally {
      setBusy(false);
    }
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
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent / guardian name" />
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
        <div className="flex justify-end">
          <FancyButton onClick={handleAdd} disabled={busy || !name.trim()} size="sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Log Enquiry
          </FancyButton>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {enquiries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <HelpCircle className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No enquiries logged yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {enquiries.map((e) => (
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
                    className={`h-7 appearance-none rounded-full border pl-2.5 pr-6 text-[11px] font-medium outline-none disabled:opacity-50 ${STATUS_STYLE[e.status]}`}
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
    </div>
  );
}
