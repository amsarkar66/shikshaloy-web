"use client";

import { useState } from "react";
import { ChevronDown, Plus, X, Loader2, ShieldCheck } from "lucide-react";
import { grantMarksEntryAccess, revokeMarksEntryAccess, type MarksGrantCombo, type MarksGrantOption, type MarksGrant } from "../actions";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export default function MarksEntryPermissionClient({
  examId, combos, staffOptions, initialGrants,
}: {
  examId: string;
  combos: MarksGrantCombo[];
  staffOptions: MarksGrantOption[];
  initialGrants: MarksGrant[];
}) {
  const [grants, setGrants] = useState(initialGrants);
  const [sectionSubjectId, setSectionSubjectId] = useState("");
  const [staffProfileId, setStaffProfileId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const grantsByCombo: Record<string, MarksGrant[]> = {};
  for (const g of grants) (grantsByCombo[g.sectionSubjectId] ??= []).push(g);

  async function handleGrant() {
    if (!sectionSubjectId || !staffProfileId) {
      setError("Choose a class/subject and a teacher.");
      return;
    }
    if (grants.some((g) => g.sectionSubjectId === sectionSubjectId && g.staffProfileId === staffProfileId)) {
      setError("Already granted.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await grantMarksEntryAccess(examId, sectionSubjectId, staffProfileId);
      const staff = staffOptions.find((s) => s.profileId === staffProfileId);
      setGrants((prev) => [...prev, { id: crypto.randomUUID(), sectionSubjectId, staffProfileId, staffName: staff?.name ?? "—" }]);
      setStaffProfileId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant access");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(grantId: string) {
    setRevokingId(grantId);
    setError(null);
    try {
      await revokeMarksEntryAccess(grantId, examId);
      setGrants((prev) => prev.filter((g) => g.id !== grantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  }

  if (combos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldCheck className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No sections/subjects set up yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 dark:text-zinc-400">
        Marks for any class/subject can always be entered by the assigned subject teacher, or by an admin/staff account.
        Grant access here to let a specific teacher enter marks for this exam only — e.g. a substitute covering for the regular teacher.
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class · Subject</label>
            <div className="relative">
              <select className={selectClass} value={sectionSubjectId} onChange={(e) => setSectionSubjectId(e.target.value)}>
                <option value="">Select</option>
                {combos.map((c) => <option key={c.sectionSubjectId} value={c.sectionSubjectId}>{c.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Grant to teacher</label>
            <div className="relative">
              <select className={selectClass} value={staffProfileId} onChange={(e) => setStaffProfileId(e.target.value)}>
                <option value="">Select</option>
                {staffOptions.map((s) => <option key={s.profileId} value={s.profileId}>{s.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <button
            onClick={handleGrant}
            disabled={busy}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 px-3 text-sm text-white transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Grant access
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {combos.map((c) => {
            const comboGrants = grantsByCombo[c.sectionSubjectId] ?? [];
            return (
              <div key={c.sectionSubjectId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{c.label}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{c.defaultTeacherName ? `${c.defaultTeacherName} · default` : "No assigned teacher"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {comboGrants.length === 0 ? (
                    <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                  ) : (
                    comboGrants.map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 pl-2.5 pr-1.5 py-1 text-xs text-gray-700 dark:text-zinc-300"
                      >
                        {g.staffName}
                        <button
                          onClick={() => handleRevoke(g.id)}
                          disabled={revokingId === g.id}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 dark:text-zinc-500 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                        >
                          {revokingId === g.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
