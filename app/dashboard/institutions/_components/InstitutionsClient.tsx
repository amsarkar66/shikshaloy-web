"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Clock, CheckCircle2, XCircle, Search,
  MapPin, Phone, Globe, Mail, Users, Briefcase,
  CalendarDays, GraduationCap, Hash,
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

// ── List view — full detail, one institution per row ────────────────────────

function InstitutionListCard({ inst }: { inst: PendingInstitution }) {
  const submitted = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const location = [inst.address, inst.city, inst.state, inst.pin_code, inst.country]
    .filter(Boolean)
    .join(", ");
  const grades = inst.grades_from && inst.grades_to ? `${inst.grades_from} – ${inst.grades_to}` : null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
              <Link href={`/dashboard/institutions/${inst.id}`} className="hover:underline">
                {inst.name ?? "—"}
              </Link>
            </h3>
            <TypeBadge type={inst.institution_type} />
            <BoardBadge board={inst.board} />
            <SchoolCountBadge count={inst.schools.length} />
            <StatusBadge status={inst.status} />
            {inst.established_year && (
              <span className="text-xs text-primary-500 dark:text-zinc-500">Est. {inst.established_year}</span>
            )}
          </div>

          {inst.tagline && (
            <p className="text-xs italic text-primary-500 dark:text-zinc-500">{inst.tagline}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-primary-600 dark:text-zinc-400">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                {location}
              </span>
            )}
            {inst.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary-500" />
                {inst.phone}
              </span>
            )}
            {inst.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary-500" />
                {inst.email}
              </span>
            )}
            {inst.website && (
              <a href={inst.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-800 dark:hover:text-zinc-200 transition-colors">
                <Globe className="h-3.5 w-3.5 text-primary-500" />
                {inst.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {inst.student_range && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary-500" />
                {inst.student_range} students
              </span>
            )}
            {inst.staff_range && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary-500" />
                {inst.staff_range} staff
              </span>
            )}
            {grades && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary-500" />
                Grades {grades}
              </span>
            )}
            {inst.udise_code && (
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary-500" />
                UDISE+ {inst.udise_code}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-zinc-50">{inst.owner_full_name ?? "—"}</span>
            <span className="flex items-center gap-1 text-primary-600 dark:text-zinc-400">
              <Mail className="h-3 w-3" />
              {inst.owner_email ?? "—"}
            </span>
          </div>

          {(inst.principal_name || inst.principal_email) && (
            <p className="text-xs text-primary-500 dark:text-zinc-500">
              Principal: {inst.principal_name ?? "—"}
              {inst.principal_designation ? ` · ${inst.principal_designation}` : ""}
              {inst.principal_email ? ` · ${inst.principal_email}` : ""}
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-primary-500 dark:text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Submitted {submitted}
          </p>
        </div>

        <InstitutionActions inst={inst} />
      </div>
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
    <div className="w-full space-y-6 px-6 py-8">
      <TopStats institutions={institutions} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
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

      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          {filtered.length} {filtered.length === 1 ? "institution" : "institutions"}{search && ` matching "${search}"`}
        </p>
        {(search || statusFilter !== "all") && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-14 text-center">
          <Building2 className="h-8 w-8 text-primary-400 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-400">No institutions found</p>
          <p className="text-xs text-primary-500 dark:text-zinc-500">Try adjusting your search or filter.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map((inst) => <InstitutionListCard key={inst.id} inst={inst} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((inst) => <InstitutionGridCard key={inst.id} inst={inst} />)}
        </div>
      )}
    </div>
  );
}
