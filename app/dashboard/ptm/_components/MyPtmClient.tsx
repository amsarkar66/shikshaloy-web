"use client";

import { useState } from "react";
import { CalendarDays, Users2, Plus, Clock } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { STATUS_BADGE, formatDate, type PtmSession } from "../_data/ptm";
import { ScheduleModal, BookingsModal } from "./PtmModals";

interface Section { id: string; label: string }
interface Teacher { id: string; name: string; designation: string }

export default function MyPtmClient({
  sessions, sections, teachers,
}: {
  sessions: PtmSession[];
  sections: Section[];
  teachers: Teacher[];
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [viewSession, setViewSession] = useState<PtmSession | null>(null);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">PTM Sessions</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Schedule and track parent-teacher meetings for your classes</p>
        </div>
        <FancyButton onClick={() => setScheduleOpen(true)} size="sm">
          <Plus className="h-4 w-4" /> Schedule PTM
        </FancyButton>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No PTM sessions scheduled yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => setViewSession(s)} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <span className="text-[11px] font-bold">{s.classNum}–{s.section}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Class {s.classNum}–{s.section} · {formatDate(s.date)}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500"><Clock className="h-3 w-3" /> {s.startTime} – {s.endTime} · {s.bookings.length}/{s.totalSlots} booked</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status].cls}`}>{STATUS_BADGE[s.status].label}</span>
                <Users2 className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" />
              </button>
            ))}
          </div>
        )}
      </div>

      {scheduleOpen && (
        <ScheduleModal
          sections={sections}
          teachers={teachers}
          onClose={() => setScheduleOpen(false)}
          onScheduled={() => setScheduleOpen(false)}
        />
      )}
      {viewSession && <BookingsModal session={viewSession} onClose={() => setViewSession(null)} />}
    </div>
  );
}
