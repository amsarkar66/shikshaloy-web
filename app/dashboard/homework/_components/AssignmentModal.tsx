"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Plus, X, Loader2 } from "lucide-react";
import { assignHomework, updateHomework } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import type { Homework } from "../_data/homework";

interface Subject { id: string; name: string }
interface Section { id: string; label: string }
interface Teacher { id: string; name: string; designation: string }

export function AssignmentModal({
  open, onClose, subjects, sections, teachers, existing, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  sections: Section[];
  teachers: Teacher[];
  existing?: Homework | null;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subjectId, setSubjectId] = useState(existing?.subjectId ?? subjects[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? sections[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(existing?.teacherId ?? teachers[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !dueDate || !subjectId || !sectionId || !teacherId) return;
    setError(null);
    startTransition(async () => {
      try {
        if (existing) {
          await updateHomework(existing.id, { title, subjectId, sectionId, teacherId, dueDate, description });
        } else {
          await assignHomework({ title, subjectId, sectionId, teacherId, dueDate, description });
        }
        onSaved?.();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save assignment");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{existing ? "Edit Assignment" : "New Assignment"}</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. Algebra worksheet — Chapter 4"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Subject</label>
              <div className="relative">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Class</label>
              <div className="relative">
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Teacher</label>
            <div className="relative">
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Due date</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Instructions</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What should students do?"
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : existing ? null : <Plus className="h-4 w-4" />}
            {isPending ? (existing ? "Saving…" : "Assigning…") : existing ? "Save Changes" : "Assign"}
          </FancyButton>
        </div>
      </form>
    </div>
  );
}
