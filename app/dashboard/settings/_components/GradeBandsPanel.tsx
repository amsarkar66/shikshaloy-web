"use client";

import { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Check, Loader2, GraduationCap } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  listGradeBandsForSchool, createGradeBand, updateGradeBand, deleteGradeBand, type GradeBandRow,
} from "../actions";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function GradeBandsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [bands, setBands] = useState<GradeBandRow[] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newMinPercent, setNewMinPercent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editMinPercent, setEditMinPercent] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    listGradeBandsForSchool().then(setBands).catch(() => setBands([]));
  }, [open]);

  if (!open) return null;

  async function refresh() {
    const fresh = await listGradeBandsForSchool();
    setBands(fresh);
  }

  async function handleAdd() {
    const minPercent = Number(newMinPercent);
    if (!newLabel.trim() || newMinPercent === "") return;
    setBusy(true);
    setError(null);
    try {
      await createGradeBand(newLabel, minPercent);
      setNewLabel("");
      setNewMinPercent("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add grade");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(b: GradeBandRow) {
    setEditingId(b.id);
    setEditLabel(b.label);
    setEditMinPercent(String(b.minPercent));
  }

  async function saveEdit(id: string) {
    const minPercent = Number(editMinPercent);
    setRowBusyId(id);
    setError(null);
    try {
      await updateGradeBand(id, editLabel, minPercent);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update grade");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setRowBusyId(id);
    setError(null);
    try {
      await deleteGradeBand(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete grade");
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Grade Bands</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Define your school&apos;s own grading scale — used on report cards, gradebook, and results.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input className={inputClass} value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. A+" />
            <input
              type="number" min={0} max={100}
              className={`${inputClass} w-28 shrink-0`}
              value={newMinPercent}
              onChange={(e) => setNewMinPercent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Min %"
            />
            <FancyButton onClick={handleAdd} disabled={busy || !newLabel.trim() || newMinPercent === ""} size="sm" className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </FancyButton>
          </div>

          {bands === null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : bands.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-8">
              <GraduationCap className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center px-4">No custom scale yet — the built-in A+/A/B+/B/C/D/F scale is used until you add one.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {bands.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  {editingId === b.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input className={inputClass} value={editLabel} onChange={(e) => setEditLabel(e.target.value)} autoFocus />
                      <input
                        type="number" min={0} max={100}
                        className={`${inputClass} w-24 shrink-0`}
                        value={editMinPercent}
                        onChange={(e) => setEditMinPercent(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(b.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{b.label}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{b.minPercent}% and above</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === b.id ? (
                      <button
                        onClick={() => saveEdit(b.id)}
                        disabled={rowBusyId === b.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                      >
                        {rowBusyId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(b)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={rowBusyId === b.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
