"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { updateSection } from "../actions";
import { type TeacherOption, type StreamOption } from "./AddSectionModal";
import type { ClassSection } from "./ClassesClient";

const NEW_STREAM = "__new__";

interface EditSectionModalProps {
  section:   ClassSection;
  onClose:   () => void;
  onSaved:   () => void;
  teachers:  TeacherOption[];
  teacherId: string | null;
  streams?:  StreamOption[];
  streamId:  string | null;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function EditSectionModal({ section, onClose, onSaved, teachers, teacherId, streams = [], streamId: currentStreamId }: EditSectionModalProps) {
  const [name, setName] = useState(section.section);
  const [room, setRoom] = useState(section.room);
  const [capacity, setCapacity] = useState(String(section.capacity));
  const [classTeacherId, setClassTeacherId] = useState(teacherId ?? "");
  const [streamId, setStreamId] = useState(currentStreamId ?? "");
  const [newStreamName, setNewStreamName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">(section.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Section name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateSection({
        id: section.id,
        section: name.trim(),
        room: room || null,
        capacity: capacity ? Number(capacity) : null,
        classTeacherId: classTeacherId || null,
        streamId: streamId === NEW_STREAM ? null : streamId || null,
        newStreamName: streamId === NEW_STREAM ? newStreamName : null,
        status,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Class {section.classNum}–{section.section}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class Number</label>
              <input className={inputClass} value={section.classNum} disabled />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Section Name *</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                maxLength={2}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Room</label>
              <input className={inputClass} value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. R-101" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Capacity</label>
              <input type="number" min={1} className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
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
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Stream</label>
              {streamId === NEW_STREAM ? (
                <input
                  className={inputClass}
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  placeholder="e.g. Science"
                  autoFocus
                />
              ) : (
                <div className="relative">
                  <select className={selectClass} value={streamId} onChange={(e) => setStreamId(e.target.value)}>
                    <option value="">— None —</option>
                    {streams.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value={NEW_STREAM}>+ Add new stream…</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status==="active"?"bg-emerald-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("inactive")}
                  className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status==="inactive"?"bg-zinc-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                >
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
