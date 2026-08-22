"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Save, CheckCircle2, UserCheck, UserX, Users, CalendarDays } from "lucide-react";
import { saveExamResults, deleteExamResult } from "../../grades/actions";
import { FancyButton } from "@/components/ui/fancy-button";

export interface AttendanceCombo { key: string; sectionId: string; subjectId: string; label: string }
export interface AttendanceStudent { id: string; name: string; rollNo: string }

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ExamAttendanceClient({
  examId, combos, rosterBySection, existingAbsent, scheduleBySubject,
}: {
  examId: string;
  combos: AttendanceCombo[];
  rosterBySection: Record<string, AttendanceStudent[]>;
  existingAbsent: Record<string, boolean>;
  scheduleBySubject: Record<string, string>;
}) {
  const [selectedCombo, setSelectedCombo] = useState(combos[0]?.key ?? "");
  const [absentMap, setAbsentMap] = useState<Record<string, boolean>>({});
  const [committedAbsentIds, setCommittedAbsentIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [loadedFor, setLoadedFor] = useState("");

  const combo = combos.find((c) => c.key === selectedCombo);
  const roster = combo ? rosterBySection[combo.sectionId] ?? [] : [];

  if (loadedFor !== selectedCombo && combo) {
    const map: Record<string, boolean> = {};
    const committed = new Set<string>();
    for (const st of roster) {
      const absent = existingAbsent[`${combo.subjectId}::${st.id}`] ?? false;
      map[st.id] = absent;
      if (absent) committed.add(st.id);
    }
    setAbsentMap(map);
    setCommittedAbsentIds(committed);
    setLoadedFor(selectedCombo);
  }

  const statsTotal = roster.length;
  const statsAbsent = roster.filter((st) => absentMap[st.id]).length;
  const stats = { total: statsTotal, absent: statsAbsent, present: statsTotal - statsAbsent };

  function setAbsent(studentId: string, absent: boolean) {
    setAbsentMap((prev) => ({ ...prev, [studentId]: absent }));
    setSaved(false);
  }

  function markAll(absent: boolean) {
    const map: Record<string, boolean> = {};
    for (const st of roster) map[st.id] = absent;
    setAbsentMap(map);
    setSaved(false);
  }

  function handleSave() {
    if (!combo) return;
    const newlyAbsent = roster.filter((st) => absentMap[st.id] && !committedAbsentIds.has(st.id));
    const newlyPresent = roster.filter((st) => !absentMap[st.id] && committedAbsentIds.has(st.id));
    if (newlyAbsent.length === 0 && newlyPresent.length === 0) {
      setSaved(true);
      return;
    }

    startTransition(async () => {
      const tasks: Promise<unknown>[] = [];
      if (newlyAbsent.length > 0) {
        tasks.push(
          saveExamResults(
            examId, combo.sectionId, combo.subjectId,
            newlyAbsent.map((st) => ({ studentId: st.id, marks: 0, isAbsent: true })),
          ),
        );
      }
      for (const st of newlyPresent) {
        tasks.push(deleteExamResult(examId, combo.sectionId, combo.subjectId, st.id));
      }
      await Promise.all(tasks);
      setCommittedAbsentIds(new Set(roster.filter((st) => absentMap[st.id]).map((st) => st.id)));
      setSaved(true);
    });
  }

  if (combos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <UserCheck className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No sections/subjects to take roll call for</p>
      </div>
    );
  }

  const examDate = combo ? scheduleBySubject[combo.subjectId] : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="relative flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Class · Subject</label>
          <select
            value={selectedCombo}
            onChange={(e) => setSelectedCombo(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-800 dark:text-zinc-200 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            {combos.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {examDate && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 h-9">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(examDate)}
          </span>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => markAll(false)}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            Mark all present
          </button>
          <button
            onClick={() => markAll(true)}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            Mark all absent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Roster", value: stats.total, accent: "text-blue-500 bg-blue-500/10", icon: Users },
          { label: "Present", value: stats.present, accent: "text-emerald-500 bg-emerald-500/10", icon: UserCheck },
          { label: "Absent", value: stats.absent, accent: "text-red-500 bg-red-500/10", icon: UserX },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {roster.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">No students in this section</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {roster.map((st) => {
              const absent = absentMap[st.id] ?? false;
              return (
                <div key={st.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                  </div>
                  <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 p-0.5">
                    <button
                      onClick={() => setAbsent(st.id, false)}
                      className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${!absent ? "bg-emerald-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => setAbsent(st.id, true)}
                      className={`h-7 rounded-md px-3 text-xs font-medium transition-colors ${absent ? "bg-red-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"}`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
          </span>
        )}
        <FancyButton onClick={handleSave} disabled={isPending || roster.length === 0} size="sm">
          <Save className="h-3.5 w-3.5" /> {isPending ? "Saving…" : "Save Attendance"}
        </FancyButton>
      </div>
    </div>
  );
}
