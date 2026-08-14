"use client";

import { useState, useMemo, useTransition } from "react";
import { ChevronDown, Save, CheckCircle2, Award } from "lucide-react";
import { getGrade, gradeStyle, scoreColor, MAX_MARKS } from "../../exams/_data/exams";
import { saveExamResults } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";

export interface GradebookExam { id: string; name: string; type: string; status: string; startDate: string }
export interface GradebookCombo { key: string; sectionId: string; subjectId: string; label: string }
export interface GradebookStudent { id: string; name: string; rollNo: string }
export interface GradebookExisting { marks: number | null; isAbsent: boolean }

function resultKey(examId: string, subjectId: string, studentId: string) { return `${examId}::${subjectId}::${studentId}`; }

export default function GradebookClient({
  exams, combos, rosterBySection, existingResults,
}: {
  exams: GradebookExam[];
  combos: GradebookCombo[];
  rosterBySection: Record<string, GradebookStudent[]>;
  existingResults: Record<string, GradebookExisting>;
}) {
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [selectedCombo, setSelectedCombo] = useState(combos[0]?.key ?? "");
  const [marksMap, setMarksMap] = useState<Record<string, { marks: string; isAbsent: boolean }>>({});
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const combo = combos.find((c) => c.key === selectedCombo);
  const roster = combo ? rosterBySection[combo.sectionId] ?? [] : [];

  const initializedKey = `${examId}::${selectedCombo}`;
  const [loadedFor, setLoadedFor] = useState("");
  if (loadedFor !== initializedKey && combo) {
    const map: Record<string, { marks: string; isAbsent: boolean }> = {};
    for (const st of roster) {
      const existing = existingResults[resultKey(examId, combo.subjectId, st.id)];
      map[st.id] = { marks: existing ? String(existing.marks ?? 0) : "", isAbsent: existing?.isAbsent ?? false };
    }
    setMarksMap(map);
    setLoadedFor(initializedKey);
  }

  const stats = useMemo(() => {
    const filled = roster.filter((st) => marksMap[st.id]?.marks !== "" || marksMap[st.id]?.isAbsent);
    const scores = filled.filter((st) => !marksMap[st.id]?.isAbsent).map((st) => Number(marksMap[st.id]?.marks ?? 0));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passed = scores.filter((s) => s >= 35).length;
    return { total: roster.length, filled: filled.length, avg, passed };
  }, [roster, marksMap]);

  function updateMarks(studentId: string, marks: string) {
    setMarksMap((prev) => ({ ...prev, [studentId]: { ...prev[studentId], marks, isAbsent: false } }));
    setSaved(false);
  }

  function toggleAbsent(studentId: string) {
    setMarksMap((prev) => ({ ...prev, [studentId]: { marks: prev[studentId]?.marks ?? "", isAbsent: !prev[studentId]?.isAbsent } }));
    setSaved(false);
  }

  function handleSave() {
    if (!combo) return;
    const rows = roster.map((st) => ({
      studentId: st.id,
      marks: Math.max(0, Math.min(MAX_MARKS, Number(marksMap[st.id]?.marks || 0))),
      isAbsent: marksMap[st.id]?.isAbsent ?? false,
    }));
    startTransition(async () => {
      await saveExamResults(examId, combo.subjectId, rows);
      setSaved(true);
    });
  }

  if (exams.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <Award className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No exams found</p>
        </div>
      </div>
    );
  }

  if (combos.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <Award className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No sections/subjects assigned yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Gradebook</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Enter and review exam marks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Exam</label>
          <select
            value={examId}
            onChange={(e) => { setExamId(e.target.value); }}
            className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-800 dark:text-zinc-200 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.status})</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Students", value: stats.total, accent: "text-blue-500 bg-blue-500/10" },
          { label: "Marks Entered", value: stats.filled, accent: "text-indigo-500 bg-indigo-500/10" },
          { label: "Average", value: `${stats.avg}%`, accent: "text-emerald-500 bg-emerald-500/10" },
          { label: "Passed", value: stats.passed, accent: "text-violet-500 bg-violet-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><Award className="h-5 w-5" /></div>
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
              const row = marksMap[st.id] ?? { marks: "", isAbsent: false };
              const pct = row.marks !== "" ? Math.round((Number(row.marks) / MAX_MARKS) * 100) : 0;
              return (
                <div key={st.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                  </div>
                  <button
                    onClick={() => toggleAbsent(st.id)}
                    className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors ${row.isAbsent ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"}`}
                  >
                    Absent
                  </button>
                  <input
                    type="number" min={0} max={MAX_MARKS}
                    disabled={row.isAbsent}
                    value={row.marks}
                    onChange={(e) => updateMarks(st.id, e.target.value)}
                    placeholder="—"
                    className="h-8 w-20 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-900 dark:text-zinc-100 text-center outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
                  />
                  <span className="text-xs text-gray-400 dark:text-zinc-500 w-10">/{MAX_MARKS}</span>
                  {row.isAbsent ? (
                    <span className="text-xs font-medium text-red-500 dark:text-red-400 w-10 text-right">Absent</span>
                  ) : row.marks !== "" ? (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeStyle(getGrade(pct))} ${scoreColor(pct)}`}>{getGrade(pct)}</span>
                  ) : (
                    <span className="w-10" />
                  )}
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
        <FancyButton
          onClick={handleSave}
          disabled={isPending || roster.length === 0}
          size="sm"
        >
          <Save className="h-3.5 w-3.5" /> {isPending ? "Saving…" : "Save Marks"}
        </FancyButton>
      </div>
    </div>
  );
}
