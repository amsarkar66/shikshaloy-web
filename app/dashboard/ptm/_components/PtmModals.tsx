"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { BOOKING_STATUS_BADGE, formatDate, type PtmSession } from "../_data/ptm";
import { schedulePtmSession } from "../actions";

interface Section { id: string; label: string }
interface Teacher { id: string; name: string; designation: string }

export function ScheduleModal({
  onClose, onScheduled, sections, teachers,
}: {
  onClose: () => void;
  onScheduled: () => void;
  sections: Section[];
  teachers: Teacher[];
}) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState(10);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId || !sectionId || !date) return;
    const start = startTime.split(":").map(Number);
    const end = endTime.split(":").map(Number);
    const totalMinutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
    const totalSlots = Math.max(1, Math.floor(totalMinutes / slotMinutes));
    startTransition(async () => {
      await schedulePtmSession({ sectionId, teacherId, date, startTime, endTime, slotMinutes, totalSlots });
      onScheduled();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Schedule PTM Session</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Class</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
              {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Class teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Start</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">End</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Slot (min)</label>
              <input type="number" min={5} step={5} value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"><Plus className="h-4 w-4" /> {isPending ? "Scheduling…" : "Schedule"}</button>
        </div>
      </form>
    </div>
  );
}

export function BookingsModal({ session, onClose }: { session: PtmSession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Bookings — Class {session.classNum}-{session.section}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatDate(session.date)} · {session.startTime} – {session.endTime} · {session.teacher}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {session.bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No bookings yet for this session.</p>
          ) : (
            session.bookings.map((b) => {
              const badge = BOOKING_STATUS_BADGE[b.status];
              return (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{b.parentName}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Parent of {b.studentName} · {b.time}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
