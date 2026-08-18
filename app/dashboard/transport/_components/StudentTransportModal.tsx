"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ChevronDown, Search, Check, Trash2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  assignStudentTransport,
  updateStudentTransport,
  removeStudentTransport,
  searchUnassignedStudents,
  type StudentSearchResult,
} from "../actions";
import type { Route, StudentTransport, TransportFeeStatus } from "../_data/transport";

interface StudentTransportModalProps {
  assignment?: StudentTransport | null;
  routes: Route[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function StudentTransportModal({ assignment, routes, onClose, onSaved }: StudentTransportModalProps) {
  const isEdit = !!assignment;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentSearchResult | null>(null);

  const [routeId, setRouteId] = useState(routes.find((r) => r.routeNo === assignment?.routeNo)?.id ?? "");
  const [stopName, setStopName] = useState(assignment?.stopName ?? "");
  const [monthlyFee, setMonthlyFee] = useState(String(assignment?.monthlyFee ?? ""));
  const [feeStatus, setFeeStatus] = useState<TransportFeeStatus>(assignment?.feeStatus ?? "overdue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchUnassignedStudents(query)
        .then((r) => { if (!cancelled) setResults(r); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, isEdit]);

  useEffect(() => {
    const route = routes.find((r) => r.id === routeId);
    if (route && !stopName && route.stops.length) setStopName(route.stops[0]);
  }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !selected) {
      setError("Search and select a student.");
      return;
    }
    if (!routeId) {
      setError("Select a route.");
      return;
    }
    if (!stopName.trim()) {
      setError("Stop name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        await updateStudentTransport({
          id: assignment.id,
          routeId,
          stopName: stopName.trim(),
          monthlyFee: Number(monthlyFee) || 0,
          feeStatus,
        });
      } else {
        await assignStudentTransport({
          studentId: selected!.id,
          routeId,
          stopName: stopName.trim(),
          monthlyFee: Number(monthlyFee) || 0,
          feeStatus,
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

  async function handleRemove() {
    if (!assignment) return;
    setBusy(true);
    setError(null);
    try {
      await removeStudentTransport(assignment.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove assignment");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{isEdit ? "Edit Transport Assignment" : "Assign Student to Transport"}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isEdit ? (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{assignment.studentName}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{assignment.rollNo} · Class {assignment.classNum}–{assignment.section}</p>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Student *</label>
              {selected ? (
                <div className="flex items-center justify-between rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-500/10 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{selected.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{selected.rollNo} · Class {selected.classNum}–{selected.section}</p>
                  </div>
                  <button type="button" onClick={() => { setSelected(null); setQuery(""); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    className={`${inputClass} pl-9`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or roll no…"
                    autoComplete="off"
                  />
                  {query.trim().length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg max-h-48 overflow-y-auto">
                      {searching ? (
                        <div className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</div>
                      ) : results.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500">No unassigned students found.</div>
                      ) : (
                        results.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { setSelected(r); setQuery(""); setResults([]); }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                          >
                            <div>
                              <p className="text-sm text-gray-900 dark:text-zinc-100">{r.name}</p>
                              <p className="text-xs text-gray-400 dark:text-zinc-500">{r.rollNo} · Class {r.classNum}–{r.section}</p>
                            </div>
                            <Check className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Route *</label>
            <div className="relative">
              <select className={selectClass} value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
                <option value="">— Select route —</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.routeNo} — {r.routeName}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Stop *</label>
              <input className={inputClass} value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="e.g. Central Park" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Monthly Fee (₹)</label>
              <input type="number" min={0} className={inputClass} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Fee Status</label>
              <div className="flex gap-2">
                {(["paid", "partial", "overdue"] as TransportFeeStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFeeStatus(s)}
                    className={`h-9 flex-1 rounded-lg text-sm font-medium capitalize transition-colors ${feeStatus === s ? (s === "paid" ? "bg-emerald-500 text-white" : s === "partial" ? "bg-amber-500 text-white" : "bg-red-500 text-white") : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {isEdit ? (
              <button type="button" onClick={handleRemove} disabled={busy} className="flex h-9 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <FancyButton type="submit" disabled={busy} size="sm">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? "Save Changes" : "Assign Student"}
              </FancyButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
