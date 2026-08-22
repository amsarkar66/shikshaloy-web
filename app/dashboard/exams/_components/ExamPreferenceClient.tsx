"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronDown, Loader2, ListChecks, Check, Lock } from "lucide-react";
import { getSectionPreferenceData, setStudentSubjectPreference, type SectionPreferenceData } from "../actions";

export interface PreferenceSectionOption { id: string; label: string }

function cellKey(studentId: string, sectionSubjectId: string) {
  return `${studentId}::${sectionSubjectId}`;
}

export default function ExamPreferenceClient({ sections }: { sections: PreferenceSectionOption[] }) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [data, setData] = useState<SectionPreferenceData | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId) { setData(null); return; }
    setData(null);
    setError(null);
    startLoad(async () => {
      const result = await getSectionPreferenceData(sectionId);
      setData(result);
    });
  }, [sectionId]);

  async function toggle(studentId: string, sectionSubjectId: string, checked: boolean) {
    if (!data) return;
    setError(null);
    setBusyKey(cellKey(studentId, sectionSubjectId));
    const previousSelections = data.selections;
    const current = new Set(previousSelections[studentId] ?? []);
    if (checked) current.add(sectionSubjectId); else current.delete(sectionSubjectId);
    setData({ ...data, selections: { ...previousSelections, [studentId]: Array.from(current) } });
    try {
      await setStudentSubjectPreference(studentId, sectionSubjectId, checked);
    } catch (err) {
      setData((prev) => prev && { ...prev, selections: previousSelections });
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setBusyKey(null);
    }
  }

  if (sections.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <ListChecks className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No sections found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Exam Preference</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Choose which elective subject each student is examined in</p>
      </div>

      <div className="relative max-w-xs">
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Section</label>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-800 dark:text-zinc-200 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        >
          {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 bottom-2.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {data?.locked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5 shrink-0" /> Locked — an exam this academic year has already started, so choices can no longer be changed.
        </div>
      )}

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
        </div>
      ) : data.electives.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No elective subjects offered to this section — mark a subject as &ldquo;Elective&rdquo; in Subjects first.</p>
        </div>
      ) : data.students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No students in this section</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-700/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">Student</th>
                {data.electives.map((e) => (
                  <th key={e.sectionSubjectId} className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {e.subjectName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {data.students.map((st) => (
                <tr key={st.id}>
                  <td className="px-4 py-2.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                  </td>
                  {data.electives.map((e) => {
                    const checked = (data.selections[st.id] ?? []).includes(e.sectionSubjectId);
                    const busy = busyKey === cellKey(st.id, e.sectionSubjectId);
                    return (
                      <td key={e.sectionSubjectId} className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => toggle(st.id, e.sectionSubjectId, !checked)}
                          disabled={busy || data.locked}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${checked ? "bg-primary-500 border-primary-500 text-white" : "border-gray-300 dark:border-zinc-600 text-transparent hover:border-primary-400"}`}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin text-gray-400" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
