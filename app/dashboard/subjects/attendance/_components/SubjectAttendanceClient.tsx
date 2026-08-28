"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckSquare, CalendarOff,
  Calendar as CalendarIcon, Clock, MapPin, UserRound,
} from "lucide-react";
import { markSubjectAttendance, markClassNotConducted } from "../../attendance-actions";
import { uuidAvatarColor, nameInitials, todayStr, addDays, formatLong } from "../../../attendance/_components/attendance-shared";

export type SubjectStatus = "present" | "absent";
type SubjectDisplayStatus = SubjectStatus | "unmarked";

export interface SubjectStudent {
  id: string;
  name: string;
  rollNo: string;
}

const SUBJECT_STATUS: Record<SubjectDisplayStatus, { label: string; active: string; ghost: string }> = {
  present:  { label: "Present", active: "bg-emerald-500 text-white border-emerald-500", ghost: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400" },
  absent:   { label: "Absent",  active: "bg-red-500     text-white border-red-500",     ghost: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400"    },
  unmarked: { label: "Not Marked", active: "bg-gray-400 text-white border-gray-400",    ghost: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400" },
};
const SUBJECT_BADGE: Record<SubjectDisplayStatus, string> = {
  present:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  absent:   "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  unmarked: "bg-gray-500/10    text-gray-500    dark:text-zinc-400    border-gray-500/20",
};

export default function SubjectAttendanceClient({
  slotId, subjectName, classLabel, teacherName, room, periodStart, periodEnd,
  students, initialStatusMap, dateStr, conducted: initialConducted, remarks: initialRemarks,
}: {
  slotId: string;
  subjectName: string;
  classLabel: string;
  teacherName: string;
  room: string;
  periodStart: string;
  periodEnd: string;
  students: SubjectStudent[];
  initialStatusMap: Record<string, SubjectStatus>;
  dateStr: string;
  conducted: boolean;
  remarks: string | null;
}) {
  const router = useRouter();
  const [statusMap, setStatusMap] = useState(initialStatusMap);
  const [conducted, setConducted] = useState(initialConducted);
  const [remarks, setRemarks] = useState(initialRemarks ?? "");
  const [showNotConductedForm, setShowNotConductedForm] = useState(false);
  const isToday = dateStr === todayStr();

  function goToDate(d: string) {
    router.push(`/dashboard/subjects/attendance/${slotId}?date=${d}`);
  }

  const setStatus = useCallback((studentId: string, status: SubjectStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    setConducted(true);
    void markSubjectAttendance(slotId, dateStr, studentId, status);
  }, [slotId, dateStr]);

  const markAllPresent = useCallback(() => {
    const map: Record<string, SubjectStatus> = {};
    students.forEach((st) => { map[st.id] = "present"; });
    setStatusMap((prev) => ({ ...prev, ...map }));
    setConducted(true);
    students.forEach((st) => { void markSubjectAttendance(slotId, dateStr, st.id, "present"); });
  }, [students, slotId, dateStr]);

  const submitNotConducted = useCallback(() => {
    setConducted(false);
    setStatusMap({});
    setShowNotConductedForm(false);
    void markClassNotConducted(slotId, dateStr, remarks.trim() || undefined);
  }, [slotId, dateStr, remarks]);

  const counts = useMemo(() => ({
    present: students.filter((st) => statusMap[st.id] === "present").length,
    absent:  students.filter((st) => statusMap[st.id] === "absent").length,
    unmarked: students.filter((st) => !statusMap[st.id]).length,
  }), [students, statusMap]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{subjectName} — Class {classLabel}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> {periodStart}{periodEnd ? ` – ${periodEnd}` : ""}</span>
            {room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/> Room {room}</span>}
            <span className="flex items-center gap-1"><UserRound className="h-3 w-3"/> {teacherName}</span>
          </p>
        </div>

        <div className="sm:ml-auto flex items-center gap-1">
          <button onClick={() => goToDate(addDays(dateStr, -7))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors" title="Previous week"><ChevronLeft className="h-4 w-4"/></button>
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">{formatLong(dateStr)}</span>
            {isToday && <span className="text-[9px] font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Today</span>}
          </div>
          <button onClick={() => goToDate(addDays(dateStr, 7))} disabled={isToday} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Next week"><ChevronRight className="h-4 w-4"/></button>
        </div>
      </div>

      {!conducted ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <CalendarOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Class not conducted</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{remarks || "No reason given."}</p>
            </div>
          </div>
          <button onClick={() => setConducted(true)} className="shrink-0 flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 px-3 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
            Take Attendance Instead
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Present</p><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{counts.present}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Absent</p><p className="text-lg font-bold text-red-600 dark:text-red-400">{counts.absent}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Not Marked</p><p className="text-lg font-bold text-gray-500 dark:text-zinc-400">{counts.unmarked}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={markAllPresent} className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><CheckSquare className="h-3.5 w-3.5"/> Mark All Present</button>
            <button onClick={() => setShowNotConductedForm((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><CalendarOff className="h-3.5 w-3.5"/> Mark Class Not Conducted</button>
          </div>

          {showNotConductedForm && (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 space-y-3">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason (optional) — e.g. teacher absent, exam, cancelled…"
                rows={2}
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="flex gap-2">
                <button onClick={submitNotConducted} className="flex h-8 items-center rounded-lg bg-amber-500 hover:bg-amber-600 px-3 text-xs font-medium text-white transition-colors">Confirm Not Conducted</button>
                <button onClick={() => setShowNotConductedForm(false)} className="flex h-8 items-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
            {students.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">No students in this section</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {students.map((st) => {
                  const status: SubjectDisplayStatus = statusMap[st.id] ?? "unmarked";
                  return (
                    <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(st.id)}`}>{nameInitials(st.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                      </div>
                      <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SUBJECT_BADGE[status]}`}>{SUBJECT_STATUS[status].label}</span>
                      <div className="hidden sm:flex items-center gap-1">
                        {(["present", "absent"] as SubjectStatus[]).map((s) => (
                          <button key={s} onClick={() => setStatus(st.id, s)} className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors ${status === s ? SUBJECT_STATUS[s].active : SUBJECT_STATUS[s].ghost}`}>{SUBJECT_STATUS[s].label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
