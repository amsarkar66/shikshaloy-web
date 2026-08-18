"use client";

import { useMemo, useState } from "react";
import {
  History, Search, X, ChevronLeft, ChevronRight, ChevronDown,
  Download, PlusCircle, Pencil, Trash2, CheckCircle2, XCircle, LogIn,
} from "lucide-react";
import {
  ACTION_BADGE, formatDateTime,
  type AuditAction, type AuditEntry,
} from "../_data/audit-log";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

const ACTION_ICON: Record<AuditAction, React.ElementType> = {
  create: PlusCircle,
  update: Pencil,
  delete: Trash2,
  approve: CheckCircle2,
  reject: XCircle,
  login: LogIn,
};

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase(); }

const PAGE_SIZE = 10;

export default function AuditLogClient({ entries }: { entries: AuditEntry[] }) {
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | string>("all");
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");
  const [page, setPage] = useState(1);

  const modules = useMemo(() => Array.from(new Set(entries.map((e) => e.module))).sort(), [entries]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => {
      const matchQ = !q || e.actor.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.schoolName?.toLowerCase().includes(q) ?? false);
      const matchModule = moduleFilter === "all" || e.module === moduleFilter;
      const matchAction = actionFilter === "all" || e.action === actionFilter;
      return matchQ && matchModule && matchAction;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [entries, query, moduleFilter, actionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || moduleFilter !== "all" || actionFilter !== "all";

  function clearFilters() { setQuery(""); setModuleFilter("all"); setActionFilter("all"); setPage(1); }

  const showSchool = entries.some((e) => e.schoolName);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Audit Log</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track who changed what, across every module</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by actor or description…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
          <option value="all">All Modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value as "all" | AuditAction); setPage(1); }}
          className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="login">Login</option>
        </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first">Actor</Th>
          {showSchool && <Th>Institution</Th>}
          <Th>Action</Th>
          <Th>Module</Th>
          <Th>Description</Th>
          <Th>Timestamp</Th>
          <Th position="last">IP</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={showSchool ? 7 : 6} icon={History} message="No matching entries" />
          ) : (
            pageData.map((e) => {
              const badge = ACTION_BADGE[e.action];
              const ActionIcon = ACTION_ICON[e.action];
              return (
                <Tr key={e.id}>
                  <Td position="first">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(e.id)}`}>{initials(e.actor)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{e.actor}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{e.actorRole}</p>
                      </div>
                    </div>
                  </Td>
                  {showSchool && (
                    <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{e.schoolName ?? "—"}</Td>
                  )}
                  <Td>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                      <ActionIcon className="h-3 w-3" /> {badge.label}
                    </span>
                  </Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{e.module}</Td>
                  <Td className="text-sm text-gray-600 dark:text-zinc-400 max-w-[320px]">{e.description}</Td>
                  <Td className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDateTime(e.timestamp)}</Td>
                  <Td position="last" className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">{e.ipAddress}</Td>
                </Tr>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
