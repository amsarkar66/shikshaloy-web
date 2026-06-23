"use client";

import { useState, useMemo } from "react";
import {
  BookMarked, BookOpen, Layers, CheckCircle2,
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X,
} from "lucide-react";
import {
  ALL_SUBJECTS, avatarColor, initials, classRange,
  type SubjectType, type SubjectStatus,
} from "./_data/subjects";

type SortField = "name" | "code" | "type" | "status" | "weeklyPeriods";
type SortDir   = "asc" | "desc";

const TYPE_BADGE: Record<SubjectType, string> = {
  core:     "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  elective: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
};

const STATUS_BADGE: Record<SubjectStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-100       text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400    border-zinc-200 dark:border-zinc-700",
};

const PAGE_SIZE = 10;
const CLASSES   = ["5", "6", "7", "8", "9", "10"];

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const total    = ALL_SUBJECTS.length;
  const core     = ALL_SUBJECTS.filter((s) => s.type === "core").length;
  const elective = ALL_SUBJECTS.filter((s) => s.type === "elective").length;
  const active   = ALL_SUBJECTS.filter((s) => s.status === "active").length;

  const items = [
    { label: "Total Subjects",    value: total,    icon: BookMarked,   accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Core Subjects",     value: core,     icon: BookOpen,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Elective Subjects", value: elective, icon: Layers,       accent: "text-violet-500  bg-violet-500/10"  },
    { label: "Active",            value: active,   icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  const [query,       setQuery]     = useState("");
  const [typeFilter,  setType]      = useState("all");
  const [statusFilter,setStatus]    = useState("all");
  const [classFilter, setClass]     = useState("all");
  const [sortField,   setSortField] = useState<SortField>("name");
  const [sortDir,     setSortDir]   = useState<SortDir>("asc");
  const [page,        setPage]      = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_SUBJECTS.filter((s) => {
      const matchQ   = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.teacher.toLowerCase().includes(q);
      const matchTy  = typeFilter   === "all" || s.type   === typeFilter;
      const matchSt  = statusFilter === "all" || s.status === statusFilter;
      const matchCls = classFilter  === "all" || s.classes.includes(classFilter);
      return matchQ && matchTy && matchSt && matchCls;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")          cmp = a.name.localeCompare(b.name);
      if (sortField === "code")          cmp = a.code.localeCompare(b.code);
      if (sortField === "type")          cmp = a.type.localeCompare(b.type);
      if (sortField === "status")        cmp = a.status.localeCompare(b.status);
      if (sortField === "weeklyPeriods") cmp = a.weeklyPeriods - b.weeklyPeriods;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, typeFilter, statusFilter, classFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() { setQuery(""); setType("all"); setStatus("all"); setClass("all"); setPage(1); }
  const hasFilter = query || typeFilter !== "all" || statusFilter !== "all" || classFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, code or teacher…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => { setClass(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Classes</option>
          {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Types</option>
          <option value="core">Core</option>
          <option value="elective">Elective</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_SUBJECTS.length}</span> subjects
        </p>
        {hasFilter && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Subject <SortIcon field="name" active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Classes
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Teacher
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("type")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Type <SortIcon field="type" active={sortField === "type"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("weeklyPeriods")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Periods/wk <SortIcon field="weeklyPeriods" active={sortField === "weeklyPeriods"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Status <SortIcon field="status" active={sortField === "status"} dir={sortDir} />
                  </button>
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BookMarked className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No subjects found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">

                    {/* Subject */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${avatarColor(s.id)}`}>
                          {initials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono">{s.code}</p>
                        </div>
                      </div>
                    </td>

                    {/* Classes */}
                    <td className="px-3 py-3">
                      <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                        {classRange(s.classes)}
                      </span>
                    </td>

                    {/* Teacher */}
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[160px]">{s.teacher}</p>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGE[s.type]}`}>
                        {s.type}
                      </span>
                    </td>

                    {/* Weekly periods */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        {s.weeklyPeriods}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "…")[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span key={`e-${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        page === n
                          ? "bg-indigo-500 text-white"
                          : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
