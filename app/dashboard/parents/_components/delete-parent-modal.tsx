"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteParent } from "../actions";

interface DeleteParentModalProps {
  parentId: string;
  parentName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteParentModal({ parentId, parentName, onClose, onDeleted }: DeleteParentModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteParent(parentId);
        onDeleted();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete parent");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Delete parent?</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This will permanently remove <span className="font-medium text-gray-700 dark:text-zinc-300">{parentName}</span> and unlink them from any children on their account.
          </p>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
