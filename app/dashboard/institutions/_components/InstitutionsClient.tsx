"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Clock, CheckCircle2, XCircle, Search,
  MapPin, Phone,
  List, LayoutGrid,
} from "lucide-react";
import { StatusBadge, TypeBadge, BoardBadge, SchoolCountBadge, InstitutionActions } from "./institution-ui";
import type { PendingInstitution } from "@/lib/supabase/admin";

type StatusFilter = "all" | PendingInstitution["status"];
type ViewMode = "list" | "grid";

function TopStats({ institutions }: { institutions: PendingInstitution[] }) {
  const pending = institutions.filter((i) => i.status === "pending").length;
  const active = institutions.filter((i) => i.status === "active").length;
  const rejected = institutions.filter((i) => i.status === "rejected").length;

  const items = [
    { label: "Total institutions", value: institutions.length, icon: Building2,   color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Pending review",     value: pending,              icon: Clock,        color: "bg-amber-500/15 text-amber-500"  },
    { label: "Active",             value: active,               icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500" },
    { label: "Rejected",           value: rejected,             icon: XCircle,      color: "bg-red-500/15 text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-sm text-primary-600 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InstitutionsTable({
  institutions, search, statusFilter, onClearFilters,
}: {
  institutions: PendingInstitution[];
  search: string;
  statusFilter: StatusFilter;
  onClearFilters: () => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-zinc-800 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            <th className="px-4 py-3">Institution</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
          {institutions.map((inst) => {
            const location = [inst.city, inst.state].filter(Boolean).join(", ");
            const submitted = new Date(inst.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            });
            const initial = (inst.name ?? "?").trim().charAt(0).toUpperCase() || "?";

            return (
              <tr key={inst.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/institutions/${inst.id}`} className="block truncate font-medium text-gray-900 dark:text-zinc-50 hover:underline">
                        {inst.name ?? "—"}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <TypeBadge type={inst.institution_type} />
                        <BoardBadge board={inst.board} />
                        <SchoolCountBadge count={inst.schools.length} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-primary-600 dark:text-zinc-400">{location || "—"}</td>
                <td className="px-4 py-3">
                  <p className="max-w-[200px] truncate font-medium text-gray-900 dark:text-zinc-50">{inst.owner_full_name ?? "—"}</p>
                  <p className="max-w-[200px] truncate text-xs text-primary-500 dark:text-zinc-500">{inst.owner_email ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inst.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-primary-500 dark:text-zinc-500">{submitted}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <InstitutionActions inst={inst} compact />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 dark:border-zinc-800">
            <td colSpan={6} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {institutions.length} {institutions.length === 1 ? "institution" : "institutions"}
                  {search && ` matching "${search}"`}
                </p>
                {(search || statusFilter !== "all") && (
                  <button onClick={onClearFilters} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Grid view — compact card, several per row ────────────────────────────────

function InstitutionGridCard({ inst }: { inst: PendingInstitution }) {
  const location = [inst.city, inst.state].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
          <Building2 className="h-4 w-4" />
        </div>
        <StatusBadge status={inst.status} />
      </div>

      <div className="min-w-0">
        <Link href={`/dashboard/institutions/${inst.id}`} className="block truncate text-sm font-semibold text-gray-900 dark:text-zinc-50 hover:underline">
          {inst.name ?? "—"}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={inst.institution_type} />
          <BoardBadge board={inst.board} />
          <SchoolCountBadge count={inst.schools.length} />
        </div>
      </div>

      <div className="space-y-1 text-xs text-primary-600 dark:text-zinc-400">
        {location && (
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-500" />
            {location}
          </div>
        )}
        {inst.phone && (
          <div className="flex items-center gap-1.5 truncate">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary-500" />
            {inst.phone}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs">
        <span className="truncate font-medium text-gray-900 dark:text-zinc-50">{inst.owner_full_name ?? "—"}</span>
      </div>

      <InstitutionActions inst={inst} compact />
    </div>
  );
}

export default function InstitutionsClient({ institutions }: { institutions: PendingInstitution[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const filtered = institutions.filter((inst) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (inst.name ?? "").toLowerCase().includes(q) ||
      (inst.city ?? "").toLowerCase().includes(q) ||
      (inst.owner_full_name ?? "").toLowerCase().includes(q) ||
      (inst.owner_email ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Institutions</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage institution accounts</p>
      </div>

      <TopStats institutions={institutions} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search institutions, cities, owners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
          {(["all", "pending", "active", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 sm:ml-auto">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-14 text-center">
          <Building2 className="h-8 w-8 text-primary-400 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-400">No institutions found</p>
          <p className="text-xs text-primary-500 dark:text-zinc-500">Try adjusting your search or filter.</p>
        </div>
      ) : viewMode === "list" ? (
        <InstitutionsTable
          institutions={filtered}
          search={search}
          statusFilter={statusFilter}
          onClearFilters={() => { setSearch(""); setStatusFilter("all"); }}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((inst) => <InstitutionGridCard key={inst.id} inst={inst} />)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {filtered.length} {filtered.length === 1 ? "institution" : "institutions"}{search && ` matching "${search}"`}
            </p>
            {(search || statusFilter !== "all") && (
              <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
