"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users2, UserCheck, Users, AlertCircle,
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown,
  X, Phone, Mail,
} from "lucide-react";
import { ALL_PARENTS, avatarColor, initials } from "./_data/parents";
import { ALL_STUDENTS } from "../students/_data/students";
import type { FeeStatus } from "./_data/parents";

type SortField = "name" | "children" | "feeStatus";
type SortDir   = "asc" | "desc";

const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

function worstFee(childIds: number[]): FeeStatus {
  const statuses = childIds.map((id) => ALL_STUDENTS.find((s) => s.id === id)?.feeStatus ?? "paid");
  if (statuses.includes("overdue"))  return "overdue";
  if (statuses.includes("partial"))  return "partial";
  return "paid";
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

const PAGE_SIZE = 10;

function StatsRow() {
  const total    = ALL_PARENTS.length;
  const active   = ALL_PARENTS.filter((p) => p.active).length;
  const multi    = ALL_PARENTS.filter((p) => p.childIds.length > 1).length;
  const overdue  = ALL_PARENTS.filter((p) => worstFee(p.childIds) === "overdue").length;

  const items = [
    { label: "Total Parents",     value: total,   icon: Users2,      accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",            value: active,  icon: UserCheck,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Multiple Children", value: multi,   icon: Users,       accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Fee Overdue",       value: overdue, icon: AlertCircle, accent: "text-red-500     bg-red-500/10"     },
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

export default function ParentsPage() {
  const [query,     setQuery]     = useState("");
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
    return ALL_PARENTS.filter((p) => {
      const children  = p.childIds.map((id) => ALL_STUDENTS.find((s) => s.id === id));
      const childText = children.map((c) => c?.name ?? "").join(" ").toLowerCase();
      const matchQ    = !q || p.name.toLowerCase().includes(q) || p.phone.includes(q) || childText.includes(q);
      const fee       = worstFee(p.childIds);
      const matchFee  = feeFilter === "all" || fee === feeFilter;
      return matchQ && matchFee;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")      cmp = a.name.localeCompare(b.name);
      if (sortField === "children")  cmp = a.childIds.length - b.childIds.length;
      if (sortField === "feeStatus") cmp = worstFee(a.childIds).localeCompare(worstFee(b.childIds));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, feeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() { setQuery(""); setFee("all"); setPage(1); }
  const hasFilter = query || feeFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, phone or child name…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

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
            <Plus className="h-4 w-4" /> Add Parent
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_PARENTS.length}</span> parents
        </p>
        {hasFilter && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>}
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
                    Parent <SortIcon active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Contact
                </th>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={() => toggleSort("children")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Children <SortIcon active={sortField === "children"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={() => toggleSort("feeStatus")}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    Fee Status <SortIcon active={sortField === "feeStatus"} dir={sortDir} />
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
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users2 className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No parents found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((p) => {
                  const children = p.childIds.map((id) => ALL_STUDENTS.find((s) => s.id === id)!).filter(Boolean);
                  const fee      = worstFee(p.childIds);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">

                      {/* Parent */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(p.id)}`}>
                            {initials(p.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{p.name}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">{p.occupation}</p>
                          </div>
                          {!p.active && (
                            <span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-zinc-300">
                            <Phone className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500" /> {p.phone}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 truncate max-w-[180px]">
                            <Mail className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500" /> {p.email}
                          </p>
                        </div>
                      </td>

                      {/* Children */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {children.map((c) => (
                            <Link
                              key={c.id}
                              href={`/dashboard/students/${c.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-colors"
                            >
                              {c.name.split(" ")[0]} · {c.class}–{c.section}
                            </Link>
                          ))}
                        </div>
                      </td>

                      {/* Fee status */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[fee]}`}>
                          {fee}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/parents/${p.id}`}
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
                  );
                })
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
