"use client";

import { useState } from "react";
import { X, Loader2, Pencil, Trash2, Check, ChevronDown } from "lucide-react";
import { renameCategory, deleteCategory } from "../actions";

interface ManageCategoriesModalProps {
  categories: string[];
  counts: Record<string, number>;
  onClose: () => void;
  onSaved: () => void;
}

export function ManageCategoriesModal({ categories, counts, onClose, onSaved }: ManageCategoriesModalProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(cat: string) {
    setDeleting(null);
    setError(null);
    setEditing(cat);
    setEditValue(cat);
  }

  function startDelete(cat: string) {
    setEditing(null);
    setError(null);
    setDeleting(cat);
    setReassignTo(categories.find((c) => c !== cat) ?? "");
  }

  async function saveRename(cat: string) {
    const next = editValue.trim();
    if (!next || next === cat) {
      setEditing(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renameCategory(cat, next);
      setEditing(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete(cat: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteCategory(cat, reassignTo);
      setDeleting(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Manage Categories</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat} className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
                {editing === cat ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveRename(cat); if (e.key === "Escape") setEditing(null); }}
                      className="h-8 flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveRename(cat)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : deleting === cat ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                      Move <span className="font-semibold text-gray-900 dark:text-zinc-100">{counts[cat] ?? 0}</span> item{(counts[cat] ?? 0) === 1 ? "" : "s"} in <span className="font-semibold text-gray-900 dark:text-zinc-100">{cat}</span> to:
                    </p>
                    {categories.length > 1 ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <select
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                          >
                            {categories.filter((c) => c !== cat).map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => confirmDelete(cat)}
                          className="flex h-8 items-center gap-1 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {busy && <Loader2 className="h-3 w-3 animate-spin" />} Move &amp; Delete
                        </button>
                        <button type="button" onClick={() => setDeleting(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-zinc-500">This is the only category — rename it instead, or add another category first.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{cat}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{counts[cat] ?? 0} item{(counts[cat] ?? 0) === 1 ? "" : "s"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(cat)} title="Rename" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => startDelete(cat)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">No categories yet.</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
