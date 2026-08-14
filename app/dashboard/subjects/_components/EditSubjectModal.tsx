"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { updateSubject } from "../actions";

export interface EditableSubject {
  id:            string;
  name:          string;
  code:          string;
  type:          "core" | "elective";
  status:        "active" | "inactive";
  weeklyPeriods: number;
}

interface EditSubjectModalProps {
  subject: EditableSubject;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

export function EditSubjectModal({ subject, onClose, onSaved }: EditSubjectModalProps) {
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code);
  const [type, setType] = useState<"core" | "elective">(subject.type);
  const [weeklyPeriods, setWeeklyPeriods] = useState(String(subject.weeklyPeriods || 5));
  const [status, setStatus] = useState<"active" | "inactive">(subject.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Subject name and code are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateSubject({
        id: subject.id,
        name: name.trim(),
        code: code.trim(),
        type,
        weeklyPeriods: weeklyPeriods ? Number(weeklyPeriods) : null,
        status,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subject");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Subject</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Subject Name *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Code *</label>
              <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Periods / wk</label>
              <input type="number" min={1} className={inputClass} value={weeklyPeriods} onChange={(e) => setWeeklyPeriods(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setType("core")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${type==="core"?"bg-indigo-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>
                  Core
                </button>
                <button type="button" onClick={() => setType("elective")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${type==="elective"?"bg-violet-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>
                  Elective
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStatus("active")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status==="active"?"bg-emerald-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>
                  Active
                </button>
                <button type="button" onClick={() => setStatus("inactive")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status==="inactive"?"bg-zinc-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
