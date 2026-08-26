"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { deleteSchool } from "../actions";

interface DeleteSchoolModalProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20";

export function DeleteSchoolModal({ open, onClose, schoolId, schoolName }: DeleteSchoolModalProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    if (busy) return;
    setConfirmText("");
    setError(null);
    onClose();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteSchool(schoolId);
      router.push("/dashboard/schools");
      router.refresh();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove school");
    } finally {
      setBusy(false);
    }
  }

  const nameMatches = confirmText.trim() === schoolName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" /> Remove School
          </p>
          <button onClick={handleClose} disabled={busy} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>This permanently deletes <strong>{schoolName}</strong> — students, staff, parents, fees, exams, and every other record scoped to this school. This can&apos;t be undone.</p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">Login accounts (staff, students, parents, drivers) are kept — only this school&apos;s data is removed.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">
              Type <span className="font-semibold text-gray-700 dark:text-zinc-300">{schoolName}</span> to confirm
            </label>
            <input className={inputClass} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} disabled={busy} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton onClick={handleDelete} disabled={!nameMatches || busy} size="sm" className="!bg-red-600 !border-red-700 hover:!bg-red-700">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remove school
            </FancyButton>
          </div>
        </div>
      </div>
    </div>
  );
}
