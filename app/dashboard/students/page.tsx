"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, UserCheck, UserPlus, AlertCircle,
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown,
  X, GraduationCap,
} from "lucide-react";
import { ALL_STUDENTS, avatarColor, initials, type FeeStatus } from "./_data/students";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = "name" | "class" | "attendance" | "feeStatus";
type SortDir   = "asc" | "desc";

const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

function attendanceColor(pct: number) {
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function attendanceBar(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

const PAGE_SIZE = 10;
const CLASSES  = ["5", "6", "7", "8", "9", "10"];

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const total    = ALL_STUDENTS.length;
  const active   = ALL_STUDENTS.filter((s) => s.active).length;
  const overdue  = ALL_STUDENTS.filter((s) => s.feeStatus === "overdue").length;
  const newCount = 3; // mock: new this month

  const items = [
    { label: "Total Students",   value: total,    icon: Users,      accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",           value: active,   icon: UserCheck,  accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Enrolled This Month", value: newCount, icon: UserPlus, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Fee Overdue",      value: overdue,  icon: AlertCircle,accent: "text-red-500     bg-red-500/10"     },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-4.5 w-4.5 h-5 w-5" />
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

// ── Sort header ───────────────────────────────────────────────────────────────

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [query,     setQuery]     = useState("");
  const [classFilter, setClass]   = useState("all");
  const [feeFilter, setFee]       = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");
  const [page,      setPage]      = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_STUDENTS.filter((s) => {
      const matchQ   = !q || s.name.toLowerCase().includes(q) || s.rollNo.includes(q) || s.parent.toLowerCase().includes(q);
      const matchCls = classFilter === "all" || s.class === classFilter;
      const matchFee = feeFilter   === "all" || s.feeStatus === feeFilter;
      return matchQ && matchCls && matchFee;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")       cmp = a.name.localeCompare(b.name);
      if (sortField === "class")      cmp = Number(a.class) - Number(b.class) || a.section.localeCompare(b.section);
      if (sortField === "attendance") cmp = a.attendance - b.attendance;
      if (sortField === "feeStatus")  cmp = a.feeStatus.localeCompare(b.feeStatus);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, classFilter, feeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setQuery(""); setClass("all"); setFee("all"); setPage(1);
  }

  const hasFilter = query || classFilter !== "all" || feeFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Stats */}
      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, roll no or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Class filter */}
        <select
          value={classFilter}
          onChange={(e) => { setClass(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Classes</option>
          {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>

        {/* Fee filter */}
        <select
          value={feeFilter}
          onChange={(e) => { setFee(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
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
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_STUDENTS.length}</span> students
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
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Student <SortIcon field="name" active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={() => toggleSort("class")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Class <SortIcon field="class" active={sortField === "class"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Parent / Guardian
                </th>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={() => toggleSort("attendance")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Attendance <SortIcon field="attendance" active={sortField === "attendance"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={() => toggleSort("feeStatus")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Fee Status <SortIcon field="feeStatus" active={sortField === "feeStatus"} dir={sortDir} />
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
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">

                    {/* Student */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>
                          {initials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
                        </div>
                        {!s.active && (
                          <span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {s.class}–{s.section}
                      </span>
                    </td>

                    {/* Parent */}
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[160px]">{s.parent}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p>
                    </td>

                    {/* Attendance */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-[96px]">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                          <div
                            className={`h-1.5 rounded-full ${attendanceBar(s.attendance)}`}
                            style={{ width: `${s.attendance}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${attendanceColor(s.attendance)}`}>
                          {s.attendance}%
                        </span>
                      </div>
                    </td>

                    {/* Fee status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>
                        {s.feeStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
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
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
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
