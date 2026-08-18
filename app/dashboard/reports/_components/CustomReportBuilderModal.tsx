"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  BUILDER_ENTITIES, OPERATORS_BY_TYPE,
  type EntityKey, type ReportFilter, type AggregateFn, type FilterOperator, type CustomReportDefinition,
} from "../_data/report-builder-fields";
import { createCustomReport, updateCustomReport } from "../actions";

const ENTITY_LIST = Object.values(BUILDER_ENTITIES);
const selectClass = "h-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const inputClass = "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export interface CustomReportEditTarget {
  id: string;
  name: string;
  description: string;
  def: CustomReportDefinition;
  isScheduled: boolean;
  scheduleLabel: string;
}

export default function CustomReportBuilderModal({
  open, onClose, onSaved, editing, defaultScheduled,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: CustomReportEditTarget | null;
  defaultScheduled?: boolean;
}) {
  const [entity, setEntity] = useState<EntityKey>(editing?.def.entity ?? "students");
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [columns, setColumns] = useState<string[]>(editing?.def.columns ?? []);
  const [filters, setFilters] = useState<ReportFilter[]>(editing?.def.filters ?? []);
  const [grouped, setGrouped] = useState(!!editing?.def.groupBy);
  const [groupBy, setGroupBy] = useState(editing?.def.groupBy ?? "");
  const [aggFn, setAggFn] = useState<AggregateFn>(editing?.def.aggregate?.fn ?? "count");
  const [aggField, setAggField] = useState(editing?.def.aggregate?.field ?? "");
  const [sortBy, setSortBy] = useState(editing?.def.sortBy ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(editing?.def.sortDir ?? "asc");
  const [isScheduled, setIsScheduled] = useState(editing?.isScheduled ?? defaultScheduled ?? false);
  const [scheduleLabel, setScheduleLabel] = useState(editing?.scheduleLabel ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = BUILDER_ENTITIES[entity];

  function pickEntity(key: EntityKey) {
    setEntity(key);
    setColumns([]);
    setFilters([]);
    setGroupBy("");
    setAggField("");
    setSortBy("");
  }

  function toggleColumn(key: string) {
    setColumns((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  function addFilter() {
    const first = meta.fields[0];
    setFilters((prev) => [...prev, { field: first.key, operator: OPERATORS_BY_TYPE[first.type][0].value, value: "" }]);
  }

  function updateFilter(idx: number, patch: Partial<ReportFilter>) {
    setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function removeFilter(idx: number) {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (columns.length === 0) return setError("Select at least one column.");
    if (grouped && (!groupBy || (aggFn !== "count" && !aggField))) {
      return setError("Choose a group-by field and what to aggregate.");
    }

    setSaving(true);
    try {
      const input = {
        name,
        description,
        entity,
        columns,
        filters,
        groupBy: grouped ? groupBy : null,
        aggregate: grouped ? { field: aggFn === "count" ? "" : aggField, fn: aggFn } : null,
        sortBy: grouped ? null : (sortBy || null),
        sortDir,
        isScheduled,
        scheduleLabel: isScheduled ? scheduleLabel : undefined,
      };
      if (editing) await updateCustomReport(editing.id, input);
      else await createCustomReport(input);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save report");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {editing ? "Edit Custom Report" : defaultScheduled ? "New Scheduled Report" : "New Custom Report"}
          </p>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Report Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Overdue fees by class" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this report for?" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Data Source</label>
            <select
              value={entity}
              onChange={(e) => pickEntity(e.target.value as EntityKey)}
              className={`${inputClass} appearance-none`}
            >
              {ENTITY_LIST.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">{meta.description}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Columns to include</label>
            <div className="flex flex-wrap gap-1.5">
              {meta.fields.map((f) => (
                <button
                  key={f.key}
                  onClick={() => toggleColumn(f.key)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    columns.includes(f.key)
                      ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                      : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Filters</label>
              <button onClick={addFilter} className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                <Plus className="h-3 w-3" /> Add filter
              </button>
            </div>
            {filters.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500">No filters — includes all records in the date range.</p>
            ) : (
              <div className="space-y-2">
                {filters.map((f, i) => {
                  const fieldMeta = meta.fields.find((x) => x.key === f.field) ?? meta.fields[0];
                  const ops = OPERATORS_BY_TYPE[fieldMeta.type];
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <select
                        value={f.field}
                        onChange={(e) => {
                          const nf = meta.fields.find((x) => x.key === e.target.value)!;
                          updateFilter(i, { field: nf.key, operator: OPERATORS_BY_TYPE[nf.type][0].value, value: "" });
                        }}
                        className={`${selectClass} flex-1 min-w-0`}
                      >
                        {meta.fields.map((mf) => <option key={mf.key} value={mf.key}>{mf.label}</option>)}
                      </select>
                      <select
                        value={f.operator}
                        onChange={(e) => updateFilter(i, { operator: e.target.value as FilterOperator })}
                        className={`${selectClass} w-24 shrink-0`}
                      >
                        {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {fieldMeta.type === "select" ? (
                        <select value={f.value} onChange={(e) => updateFilter(i, { value: e.target.value })} className={`${selectClass} flex-1 min-w-0`}>
                          <option value="">—</option>
                          {fieldMeta.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={fieldMeta.type === "date" ? "date" : fieldMeta.type === "number" ? "number" : "text"}
                          value={f.value}
                          onChange={(e) => updateFilter(i, { value: e.target.value })}
                          className={`${selectClass} flex-1 min-w-0`}
                        />
                      )}
                      <button onClick={() => removeFilter(i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
              <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} className="rounded" />
              Group &amp; summarize instead of listing every row
            </label>
            {grouped && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Group by</label>
                  <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className={`${selectClass} w-full`}>
                    <option value="">Select field…</option>
                    {meta.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Then</label>
                  <select value={aggFn} onChange={(e) => setAggFn(e.target.value as AggregateFn)} className={`${selectClass} w-full`}>
                    <option value="count">Count</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                  </select>
                </div>
                {aggFn !== "count" && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Of field</label>
                    <select value={aggField} onChange={(e) => setAggField(e.target.value)} className={`${selectClass} w-full`}>
                      <option value="">Select field…</option>
                      {meta.fields.filter((f) => f.type === "number").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {!grouped && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Sort by</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${selectClass} w-full`}>
                  <option value="">Default</option>
                  {meta.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase">Direction</label>
                <select value={sortDir} onChange={(e) => setSortDir(e.target.value as "asc" | "desc")} className={`${selectClass} w-full`}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
              <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="rounded" />
              Mark as a scheduled report
            </label>
            {isScheduled && (
              <input value={scheduleLabel} onChange={(e) => setScheduleLabel(e.target.value)} placeholder="e.g. Weekly, Monthly" className={`${selectClass} w-full h-9`} />
            )}
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Shows this report under the Schedules tab. It doesn&rsquo;t run automatically — you still generate it manually.</p>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            Cancel
          </button>
          <FancyButton onClick={handleSave} disabled={saving} size="sm" className="flex-1">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Report"}
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
