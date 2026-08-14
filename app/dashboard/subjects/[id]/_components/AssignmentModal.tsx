"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { assignSubjectToSection, updateSubjectAssignment } from "../../actions";
import type { SubjectAssignment, SectionOption, TeacherOption } from "./SubjectDetailClient";

interface AssignmentModalProps {
  subjectId:             string;
  defaultWeeklyPeriods:  number;
  teachers:              TeacherOption[];
  availableSections?:    SectionOption[];
  assignment?:           SubjectAssignment | null;
  onClose:               () => void;
  onSaved:               () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function AssignmentModal({
  subjectId, defaultWeeklyPeriods, teachers, availableSections = [], assignment, onClose, onSaved,
}: AssignmentModalProps) {
  const isEdit = !!assignment;
  const [sectionId, setSectionId] = useState(assignment?.sectionId ?? "");
  const [teacherId, setTeacherId] = useState(assignment?.teacherId ?? "");
  const [weeklyPeriods, setWeeklyPeriods] = useState(String(assignment?.weeklyPeriods ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !sectionId) {
      setError("Select a class to assign this subject to.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isEdit && assignment) {
        await updateSubjectAssignment({
          id: assignment.id,
          subjectId,
          teacherId: teacherId || null,
          weeklyPeriods: weeklyPeriods ? Number(weeklyPeriods) : null,
        });
      } else {
        await assignSubjectToSection({
          subjectId,
          sectionId,
          teacherId: teacherId || null,
          weeklyPeriods: weeklyPeriods ? Number(weeklyPeriods) : null,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment");
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">
            {isEdit ? `Edit Assignment — Class ${assignment?.classNum}–${assignment?.sectionName}` : "Assign to Class"}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class *</label>
              {isEdit ? (
                <input className={inputClass} value={`Class ${assignment?.classNum}–${assignment?.sectionName}`} disabled />
              ) : (
                <div className="relative">
                  <select className={selectClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
                    <option value="">— Select class —</option>
                    {availableSections.map((s) => (
                      <option key={s.id} value={s.id}>Class {s.classNum}–{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Teacher</label>
              <div className="relative">
                <select className={selectClass} value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  <option value="">— None —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Periods / wk</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={weeklyPeriods}
                onChange={(e) => setWeeklyPeriods(e.target.value)}
                placeholder={String(defaultWeeklyPeriods || 5)}
              />
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
              {isEdit ? "Save Changes" : "Assign"}
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
