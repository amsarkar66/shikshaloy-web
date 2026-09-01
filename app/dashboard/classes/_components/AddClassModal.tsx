"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createClass } from "../actions";
import type { TeacherOption } from "./AddSectionModal";

interface AddClassModalProps {
  open:      boolean;
  onClose:   () => void;
  onCreated: () => void;
  teachers:  TeacherOption[];
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function AddClassModal({ open, onClose, onCreated, teachers }: AddClassModalProps) {
  const [classNum, setClassNum] = useState("");
  const [room, setRoom] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setClassNum("");
    setRoom("");
    setCapacity("40");
    setClassTeacherId("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classNum.trim()) {
      setError("Class number is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createClass({
        classNum: classNum.trim(),
        room: room || null,
        capacity: capacity ? Number(capacity) : null,
        classTeacherId: classTeacherId || null,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Add Class</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">For schools without multiple sections per class</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class Number *</label>
              <input
                className={inputClass}
                value={classNum}
                onChange={(e) => setClassNum(e.target.value)}
                placeholder="e.g. 5"
                inputMode="numeric"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Capacity</label>
              <input type="number" min={1} className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Room</label>
              <input className={inputClass} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. R-101" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class Teacher</label>
              <div className="relative">
                <select className={selectClass} value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)}>
                  <option value="">— None —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Class
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
