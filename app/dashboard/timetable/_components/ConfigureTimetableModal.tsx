"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DAYS, type Day } from "../_data/timetable";
import {
  getSectionTimetableConfig, createDefaultPeriods, saveSectionTimetable,
  type SectionTimetableConfig, type TimetableSlotInput,
} from "../actions";

interface ConfigureTimetableModalProps {
  open:       boolean;
  onClose:    () => void;
  onSaved:    () => void;
  sectionId:  string;
  classLabel: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-8 w-full appearance-none rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-6 text-xs text-gray-800 dark:text-zinc-200 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type GridState = Record<Day, Record<number, { subjectId: string; room: string }>>;

function emptyGrid(): GridState {
  return DAYS.reduce((acc, d) => ({ ...acc, [d]: {} }), {} as GridState);
}

function PeriodSetupForm({ onCreated, busy, setBusy, setError }: {
  onCreated: () => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
}) {
  const [count, setCount] = useState("8");
  const [startTime, setStartTime] = useState("08:00");
  const [periodMinutes, setPeriodMinutes] = useState("45");
  const [addBreak, setAddBreak] = useState(true);
  const [breakAfter, setBreakAfter] = useState("4");
  const [breakMinutes, setBreakMinutes] = useState("30");

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      await createDefaultPeriods({
        count: Number(count),
        startTime,
        periodMinutes: Number(periodMinutes),
        breakAfterPeriod: addBreak ? Number(breakAfter) : null,
        breakMinutes: addBreak ? Number(breakMinutes) : null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up periods");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-zinc-400">
        This school doesn&apos;t have any timetable periods set up yet. Define the daily period structure once — you can adjust the schedule per class after.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Number of Periods</label>
          <input type="number" min={1} max={15} className={inputClass} value={count} onChange={(e) => setCount(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Period Length (min)</label>
          <input type="number" min={10} max={180} className={inputClass} value={periodMinutes} onChange={(e) => setPeriodMinutes(e.target.value)} disabled={busy} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">School Start Time</label>
          <input type="time" className={inputClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={busy} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input id="addBreak" type="checkbox" checked={addBreak} onChange={(e) => setAddBreak(e.target.checked)} disabled={busy} />
          <label htmlFor="addBreak" className="text-xs font-medium text-gray-600 dark:text-zinc-300">Add a break</label>
        </div>
        {addBreak && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">After Period #</label>
              <input type="number" min={1} max={Number(count) || 1} className={inputClass} value={breakAfter} onChange={(e) => setBreakAfter(e.target.value)} disabled={busy} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Break Length (min)</label>
              <input type="number" min={5} max={120} className={inputClass} value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} disabled={busy} />
            </div>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <FancyButton type="button" size="sm" disabled={busy} onClick={handleCreate}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create Periods
        </FancyButton>
      </div>
    </div>
  );
}

export function ConfigureTimetableModal({ open, onClose, onSaved, sectionId, classLabel }: ConfigureTimetableModalProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SectionTimetableConfig | null>(null);
  const [grid, setGrid] = useState<GridState>(emptyGrid());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSectionTimetableConfig(sectionId)
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        const next = emptyGrid();
        for (const day of DAYS) {
          const row = cfg.slots[day];
          if (!row) continue;
          for (const [numStr, slot] of Object.entries(row)) {
            if (!slot) continue;
            next[day][Number(numStr)] = { subjectId: slot.subjectId, room: slot.room };
          }
        }
        setGrid(next);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load timetable"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, sectionId]);

  if (!open) return null;

  function handleClose() {
    setConfig(null);
    setGrid(emptyGrid());
    setError(null);
    onClose();
  }

  async function refetchConfig() {
    setLoading(true);
    try {
      const cfg = await getSectionTimetableConfig(sectionId);
      setConfig(cfg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }

  function setCell(day: Day, periodNum: number, subjectId: string, room: string) {
    setGrid((prev) => ({
      ...prev,
      [day]: { ...prev[day], [periodNum]: { subjectId, room } },
    }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const entries: TimetableSlotInput[] = [];
      for (const day of DAYS) {
        for (const [numStr, cell] of Object.entries(grid[day])) {
          if (cell.subjectId) entries.push({ day, periodNumber: Number(numStr), subjectId: cell.subjectId, room: cell.room || null });
        }
      }
      await saveSectionTimetable(sectionId, entries);
      onSaved();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save timetable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4 shrink-0">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Configure Timetable</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Class {classLabel}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : !config ? null : !config.hasPeriods ? (
            <PeriodSetupForm onCreated={refetchConfig} busy={busy} setBusy={setBusy} setError={setError} />
          ) : config.subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">No subjects assigned to Class {classLabel} yet.</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Assign subjects and teachers to this class first, then come back to build the schedule.</p>
              <Link href="/dashboard/subjects" className="mt-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">Go to Subjects →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 760 }}>
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <th className="w-14 py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Period</th>
                    {DAYS.map((d) => (
                      <th key={d} className="py-2 px-1.5 text-center text-[11px] font-semibold text-gray-600 dark:text-zinc-300">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.periods.map((p) => (
                    <tr key={p.num} className="border-t border-gray-100 dark:border-zinc-700/50">
                      <td className="py-1.5 px-2 align-top">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 text-[11px] font-bold text-gray-600 dark:text-zinc-300">{p.num}</span>
                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-0.5">{p.start}</p>
                      </td>
                      {DAYS.map((day) => {
                        const cell = grid[day][p.num] ?? { subjectId: "", room: "" };
                        return (
                          <td key={day} className="py-1.5 px-1 align-top" style={{ minWidth: 118 }}>
                            <div className="relative">
                              <select
                                className={selectClass}
                                value={cell.subjectId}
                                disabled={busy}
                                onChange={(e) => setCell(day, p.num, e.target.value, cell.room)}
                              >
                                <option value="">—</option>
                                {config.subjects.map((s) => (
                                  <option key={s.id} value={s.id}>{s.code || s.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                            </div>
                            {cell.subjectId && (
                              <input
                                className="mt-1 h-6 w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 text-[10px] text-gray-600 dark:text-zinc-300 outline-none focus:border-primary-400"
                                placeholder="Room"
                                value={cell.room}
                                disabled={busy}
                                onChange={(e) => setCell(day, p.num, cell.subjectId, e.target.value)}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {config?.hasPeriods && config.subjects.length > 0 && (
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-3.5 shrink-0">
            <button type="button" onClick={handleClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="button" size="sm" disabled={busy} onClick={handleSave}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Timetable
            </FancyButton>
          </div>
        )}
      </div>
    </div>
  );
}
