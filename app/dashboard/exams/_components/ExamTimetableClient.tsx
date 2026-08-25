"use client";

import { useState } from "react";
import {
  ChevronDown, Plus, Pencil, Trash2, Check, Loader2, CalendarClock,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { saveExamScheduleSlot, deleteExamScheduleSlot, type ExamScheduleSlot } from "../actions";

export interface SubjectOption { id: string; name: string }

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface SlotForm { subjectId: string; examDate: string; startTime: string; endTime: string; room: string }

const EMPTY_FORM: SlotForm = { subjectId: "", examDate: "", startTime: "", endTime: "", room: "" };

export default function ExamTimetableClient({
  examId, subjects, initialSchedule,
}: {
  examId: string;
  subjects: SubjectOption[];
  initialSchedule: ExamScheduleSlot[];
}) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usedSubjectIds = new Set(schedule.filter((s) => s.id !== editingId).map((s) => s.subjectId));
  const availableSubjects = subjects.filter((s) => !usedSubjectIds.has(s.id));

  function update<K extends keyof SlotForm>(key: K, value: SlotForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(slot: ExamScheduleSlot) {
    setEditingId(slot.id);
    setForm({ subjectId: slot.subjectId, examDate: slot.examDate, startTime: slot.startTime, endTime: slot.endTime, room: slot.room ?? "" });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await saveExamScheduleSlot({
        examId,
        subjectId: form.subjectId,
        examDate: form.examDate,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room || null,
      });
      const subjectName = subjects.find((s) => s.id === form.subjectId)?.name ?? "Subject";
      setSchedule((prev) => {
        const withoutEdited = prev.filter((s) => s.id !== editingId);
        const newSlot: ExamScheduleSlot = {
          id: editingId ?? crypto.randomUUID(),
          subjectId: form.subjectId,
          subjectName,
          examDate: form.examDate,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null,
        };
        return [...withoutEdited, newSlot].sort((a, b) => a.examDate.localeCompare(b.examDate) || a.startTime.localeCompare(b.startTime));
      });
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule slot");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setRowBusyId(id);
    setError(null);
    try {
      await deleteExamScheduleSlot(id, examId);
      setSchedule((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete schedule slot");
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Subject</label>
            <div className="relative">
              <select className={selectClass} value={form.subjectId} onChange={(e) => update("subjectId", e.target.value)}>
                <option value="">Select</option>
                {editingId && !availableSubjects.some((s) => s.id === form.subjectId) && (
                  <option value={form.subjectId}>{subjects.find((s) => s.id === form.subjectId)?.name}</option>
                )}
                {availableSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Date</label>
            <DatePicker value={form.examDate} onChange={(v) => update("examDate", v)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Start</label>
            <input type="time" className={inputClass} value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">End</label>
            <input type="time" className={inputClass} value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Room</label>
              <input className={inputClass} value={form.room} onChange={(e) => update("room", e.target.value)} placeholder="Optional" />
            </div>
            <FancyButton onClick={handleSave} disabled={busy} size="sm" className="shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </FancyButton>
            {editingId && (
              <button onClick={cancelEdit} className="h-9 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700">
                Cancel
              </button>
            )}
          </div>
        </div>

        {schedule.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-10">
            <CalendarClock className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No papers scheduled yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {schedule.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[11px] font-bold">
                    {formatDate(slot.examDate).split(" ")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{slot.subjectName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {formatDate(slot.examDate)} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}{slot.room ? ` · ${slot.room}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(slot)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={rowBusyId === slot.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    {rowBusyId === slot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
