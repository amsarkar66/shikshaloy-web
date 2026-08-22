"use client";

import { useEffect, useState } from "react";
import { X, Plus, Pencil, Trash2, Check, Loader2, Layers2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { listStreamsWithUsage, createStream, renameStream, deleteStream, type StreamWithUsage } from "../actions";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function StreamsPanel({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const [streams, setStreams] = useState<StreamWithUsage[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    listStreamsWithUsage().then(setStreams).catch(() => setStreams([]));
  }, [open]);

  if (!open) return null;

  async function refresh() {
    const fresh = await listStreamsWithUsage();
    setStreams(fresh);
    onChanged();
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createStream(newName);
      setNewName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stream");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(s: StreamWithUsage) {
    setEditingId(s.id);
    setEditingName(s.name);
  }

  async function saveEdit(id: string) {
    setRowBusyId(id);
    setError(null);
    try {
      await renameStream(id, editingName);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename stream");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setRowBusyId(id);
    setError(null);
    try {
      await deleteStream(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stream");
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Manage Streams</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
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
            <input
              className={inputClass}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="e.g. Commerce"
            />
            <FancyButton onClick={handleAdd} disabled={busy || !newName.trim()} size="sm" className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </FancyButton>
          </div>

          {streams === null ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : streams.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-8">
              <Layers2 className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs text-gray-400 dark:text-zinc-500">No streams yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {streams.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  {editingId === s.id ? (
                    <input
                      className={inputClass}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(s.id); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                    />
                  ) : (
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{s.sectionCount} section{s.sectionCount !== 1 ? "s" : ""}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    {editingId === s.id ? (
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={rowBusyId === s.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                      >
                        {rowBusyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={rowBusyId === s.id}
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
