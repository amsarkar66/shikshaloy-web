"use client";

import { useState, useMemo, useCallback } from "react";
import {
  UserPlus, Users, CheckCircle2, GraduationCap,
  Search, Plus, Download, X, ArrowLeft,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight,
  Phone, Mail, School, CalendarDays, StickyNote,
  CheckCheck, Clock, Ban, BookmarkCheck, RotateCcw,
} from "lucide-react";
import {
  ALL_APPLICATIONS, ACADEMIC_YEARS, APPLY_CLASSES,
  STATUS_LABEL, STATUS_BADGE, formatDate, calcAge,
  type Application, type AdmissionStatus,
} from "./_data/admissions";

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all",          label: "All"          },
  { value: "pending",      label: "Pending"      },
  { value: "under_review", label: "Under Review" },
  { value: "approved",     label: "Approved"     },
  { value: "waitlisted",   label: "Waitlisted"   },
  { value: "rejected",     label: "Rejected"     },
  { value: "enrolled",     label: "Enrolled"     },
];

type SortField = "applicationNo" | "applicantName" | "applyingForClass" | "submittedDate" | "status";
type SortDir   = "asc" | "desc";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow({ apps }: { apps: Application[] }) {
  const total      = apps.length;
  const needReview = apps.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const approved   = apps.filter((a) => a.status === "approved").length;
  const enrolled   = apps.filter((a) => a.status === "enrolled").length;

  const items = [
    { label: "Total Applications", value: total,      icon: UserPlus,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Pending Review",     value: needReview,  icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Approved",           value: approved,    icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Enrolled",           value: enrolled,    icon: GraduationCap,accent: "text-blue-500    bg-blue-500/10"    },
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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Application list ──────────────────────────────────────────────────────────

function ApplicationList({
  apps, onView,
}: {
  apps: Application[];
  onView: (id: number) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("submittedDate");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");
  const [page,      setPage]      = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const sorted = useMemo(() => [...apps].sort((a, b) => {
    let cmp = 0;
    if (sortField === "applyingForClass") {
      cmp = parseInt(a.applyingForClass) - parseInt(b.applyingForClass);
    } else {
      cmp = (a[sortField] as string).localeCompare(b[sortField] as string);
    }
    return sortDir === "asc" ? cmp : -cmp;
  }), [apps, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageApps   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function Th({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <th
        onClick={() => toggleSort(field)}
        className="cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
      >
        <div className="flex items-center gap-1">
          {children}
          <SortIcon active={sortField === field} dir={sortDir} />
        </div>
      </th>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
              <tr>
                <Th field="applicationNo">App No</Th>
                <Th field="applicantName">Applicant</Th>
                <Th field="applyingForClass">Class</Th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Parent / Guardian
                </th>
                <Th field="submittedDate">Submitted</Th>
                <Th field="status">Status</Th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">No applications found</p>
                  </td>
                </tr>
              ) : pageApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {app.applicationNo}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{app.applicantName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{app.gender} · Age {calcAge(app.dob, app.academicYear)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {app.applyingForClass}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{app.parentName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{app.parentPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {formatDate(app.submittedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[app.status]}`}>
                      {STATUS_LABEL[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onView(app.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
        <span>
          {sorted.length === 0
            ? "No results"
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                page === p
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

const DOCS = ["Birth Certificate", "Transfer Certificate", "Report Card (Last Year)", "Passport Photo"];

type Transition = { label: string; status: AdmissionStatus; icon: React.ElementType; style: string };

const TRANSITIONS: Partial<Record<AdmissionStatus, Transition[]>> = {
  pending: [
    { label: "Mark Under Review", status: "under_review", icon: Clock,         style: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20" },
    { label: "Approve",           status: "approved",     icon: CheckCheck,     style: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" },
    { label: "Reject",            status: "rejected",     icon: Ban,            style: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" },
  ],
  under_review: [
    { label: "Approve",           status: "approved",     icon: CheckCheck,     style: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" },
    { label: "Waitlist",          status: "waitlisted",   icon: BookmarkCheck,  style: "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20" },
    { label: "Reject",            status: "rejected",     icon: Ban,            style: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" },
  ],
  approved: [
    { label: "Enroll Student",    status: "enrolled",     icon: GraduationCap,  style: "bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600" },
    { label: "Reject",            status: "rejected",     icon: Ban,            style: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" },
  ],
  waitlisted: [
    { label: "Approve",           status: "approved",     icon: CheckCheck,     style: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" },
    { label: "Reject",            status: "rejected",     icon: Ban,            style: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20" },
  ],
  rejected: [
    { label: "Reconsider",        status: "pending",      icon: RotateCcw,      style: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20" },
  ],
};

function DetailView({
  app: initial, onBack,
}: {
  app: Application;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<AdmissionStatus>(initial.status);
  const transitions = TRANSITIONS[status] ?? [];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Applications
        </button>

        <div className="sm:ml-2 flex items-center gap-3 flex-wrap">
          <p className="font-mono text-sm text-gray-400 dark:text-zinc-500">{initial.applicationNo}</p>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {initial.academicYear} · Submitted {formatDate(initial.submittedDate)}
          </span>
        </div>

        {/* Action buttons */}
        {transitions.length > 0 && (
          <div className="sm:ml-auto flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t.status}
                onClick={() => setStatus(t.status)}
                className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${t.style}`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        )}

        {status === "enrolled" && (
          <div className="sm:ml-auto flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Enrolled successfully
          </div>
        )}
      </div>

      {/* Two-column info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Applicant */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Applicant Information</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Full Name",       value: initial.applicantName },
              { label: "Date of Birth",   value: `${formatDate(initial.dob)} (Age ${calcAge(initial.dob, initial.academicYear)})` },
              { label: "Gender",          value: initial.gender },
              { label: "Applying For",    value: `Class ${initial.applyingForClass}` },
              { label: "Previous School", value: initial.previousSchool ?? "—" },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">{row.label}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Guardian */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Parent / Guardian</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-0.5">Full Name</span>
              <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{initial.parentName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500">Phone</span>
              <a
                href={`tel:${initial.parentPhone}`}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {initial.parentPhone}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500">Email</span>
              <a
                href={`mailto:${initial.parentEmail}`}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {initial.parentEmail}
              </a>
            </div>
          </div>

          {/* Documents checklist */}
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/50">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">Documents</p>
            <div className="flex flex-wrap gap-2">
              {DOCS.map((doc) => (
                <span
                  key={doc}
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                  <CheckCheck className="h-3 w-3" /> {doc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {initial.notes && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Notes</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{initial.notes}</p>
        </div>
      )}

      {/* Timeline placeholder */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Timeline</h3>
        </div>
        <ol className="relative ml-2 border-l border-gray-200 dark:border-zinc-700 space-y-4">
          {[
            { date: initial.submittedDate, label: "Application submitted", sub: "Online portal" },
            ...(status !== "pending"
              ? [{ date: initial.submittedDate, label: `Status updated to ${STATUS_LABEL[status]}`, sub: "By admin" }]
              : []),
          ].map((ev, i) => (
            <li key={i} className="ml-5">
              <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-white dark:border-zinc-950 bg-indigo-500" />
              <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">{ev.label}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(ev.date)} · {ev.sub}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdmissionsPage() {
  const [query,        setQuery]   = useState("");
  const [statusFilter, setStatus]  = useState("all");
  const [classFilter,  setClass]   = useState("all");
  const [yearFilter,   setYear]    = useState("2026-27");
  const [view,         setView]    = useState<"list" | "detail">("list");
  const [activeId,     setActiveId] = useState<number | null>(null);

  const yearApps = useMemo(
    () => ALL_APPLICATIONS.filter((a) => a.academicYear === yearFilter),
    [yearFilter],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return yearApps.filter((a) => {
      const matchQ   = !q
        || a.applicantName.toLowerCase().includes(q)
        || a.applicationNo.toLowerCase().includes(q)
        || a.parentName.toLowerCase().includes(q)
        || a.parentPhone.includes(q);
      const matchSt  = statusFilter === "all" || a.status === statusFilter;
      const matchCls = classFilter  === "all" || a.applyingForClass === classFilter;
      return matchQ && matchSt && matchCls;
    });
  }, [yearApps, query, statusFilter, classFilter]);

  const hasFilter = query || statusFilter !== "all" || classFilter !== "all";

  const clearFilters = useCallback(() => {
    setQuery(""); setStatus("all"); setClass("all");
  }, []);

  function openDetail(id: number) { setActiveId(id); setView("detail"); }
  function backToList()           { setView("list"); setActiveId(null); }

  const activeApp = useMemo(
    () => ALL_APPLICATIONS.find((a) => a.id === activeId) ?? null,
    [activeId],
  );

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Admissions</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage student applications and enrolments</p>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          {/* Academic year */}
          <select
            value={yearFilter}
            onChange={(e) => { setYear(e.target.value); setView("list"); setActiveId(null); }}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm shrink-0">
            <Plus className="h-4 w-4" /> New Application
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow apps={yearApps} />

      {view === "detail" && activeApp ? (
        <DetailView app={activeApp} onBack={backToList} />
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-3">
            {/* Status pills (scrollable on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_FILTERS.map((f) => {
                const count = yearApps.filter((a) => f.value === "all" || a.status === f.value).length;
                return (
                  <button
                    key={f.value}
                    onClick={() => { setStatus(f.value); }}
                    className={`flex shrink-0 items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                      statusFilter === f.value
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {f.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      statusFilter === f.value
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + class filter + clear */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, application no or parent…"
                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={classFilter}
                  onChange={(e) => setClass(e.target.value)}
                  className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">All Classes</option>
                  {APPLY_CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>

                {hasFilter && (
                  <button
                    onClick={clearFilters}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Result count */}
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{yearApps.length}</span> applications
              {hasFilter && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">· Filters active</span>}
            </p>
          </div>

          <ApplicationList apps={filtered} onView={openDetail} />
        </>
      )}
    </div>
  );
}
