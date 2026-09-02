"use client";

// Institution-wide leave management — a school-aware adaptation of
// app/dashboard/leaves/_components/LeavesClient.tsx. Keeps every piece that
// makes that page more than a bare approve/reject queue (full history, the
// substitute-assignment workflow, advanced filters) so this tab has real
// parity with the single-school Leave Management page; drops only "New
// Request" creation, which stays a single-school action on that page.

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import {
  CalendarOff, Clock, Search,
  X, Eye, Check, Ban, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronDown, FileText, CalendarDays, ExternalLink,
  SlidersHorizontal, Loader2, Users, UserCog, Landmark,
} from "lucide-react";
import Link from "next/link";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { STATUS_BADGE, LEAVE_TYPE_LABEL, LEAVE_TYPE_BADGE, formatDate } from "../../leaves/_data/leaves";
import type { LeaveStatus, LeaveType } from "../../leaves/_data/leaves";
import {
  updateLeaveStatus,
  getAffectedPeriods, listAvailableSubstitutes, saveLeaveSubstituteAssignments, getLeaveSubstituteAssignments,
  type AffectedPeriod, type SubstituteOption,
} from "../../leaves/actions";
import { updateStudentLeaveStatus } from "../../students/actions";

export type PersonType = "staff" | "student";

export interface SchoolOption {
  id: string;
  name: string;
}

export interface Leave {
  id: string;
  personType: PersonType;
  studentId?: string;
  staffName: string;
  role: string;
  department: string;
  leaveType: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approvedBy?: string;
  schoolId: string;
  schoolName: string;
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase(); }

type SortField = "staffName"|"department"|"from"|"days"|"appliedOn"|"status";
type SortDir = "asc"|"desc";
type TabFilter = "all"|LeaveStatus;
type PersonFilter = "all"|"staff"|"student";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir==="asc"?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>;
}

function SchoolTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
      <Landmark className="h-3 w-3 shrink-0 text-violet-400" />{name}
    </span>
  );
}

function SubstituteAssignModal({
  leave, onClose, onConfirm,
}: {
  leave: Leave;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [periods, setPeriods] = useState<AffectedPeriod[] | null>(null);
  const [teachers, setTeachers] = useState<SubstituteOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAffectedPeriods(leave.id), listAvailableSubstitutes(leave.id)]).then(([p, t]) => {
      if (cancelled) return;
      setPeriods(p);
      setTeachers(t);
    });
    return () => { cancelled = true; };
  }, [leave.id]);

  const allAssigned = periods !== null && periods.every((p) => !!assignments[p.id]);

  async function handleConfirm() {
    if (!periods) return;
    setBusy(true);
    setError(null);
    try {
      await saveLeaveSubstituteAssignments(
        leave.id,
        periods.map((p) => ({ timetableSlotId: p.timetableSlotId, date: p.date, substituteStaffId: assignments[p.id] })),
      );
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save substitute plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Assign Substitutes — {leave.staffName}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {formatDate(leave.from)}{leave.from !== leave.to ? ` → ${formatDate(leave.to)}` : ""}
            {periods !== null && ` · ${periods.length} affected period${periods.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {periods === null ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : periods.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">This teacher has no timetabled periods during the leave dates — nothing to cover.</p>
          ) : periods.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{formatDate(p.date)} · {p.day} · Period {p.period} <span className="text-gray-400 dark:text-zinc-500 font-normal">({p.time})</span></p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Class {p.classSection} · {p.subject}</p>
              </div>
              <div className="relative shrink-0">
                <select
                  value={assignments[p.id] ?? ""}
                  onChange={(e) => setAssignments((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select substitute…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          ))}
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton
            onClick={handleConfirm}
            disabled={!allAssigned || busy}
            size="sm"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Check className="h-4 w-4" /> Confirm &amp; Approve
          </FancyButton>
        </div>
      </div>
    </div>
  );
}

function SubstituteViewModal({ leave, onClose }: { leave: Leave; onClose: () => void }) {
  const [rows, setRows] = useState<{ period: AffectedPeriod; substituteName: string }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAffectedPeriods(leave.id), getLeaveSubstituteAssignments(leave.id)]).then(([periods, saved]) => {
      if (cancelled) return;
      const byKey = new Map(saved.map((s) => [`${s.timetableSlotId}:${s.date}`, s.substituteName]));
      setRows(periods.map((p) => ({ period: p, substituteName: byKey.get(p.id) ?? "—" })));
    });
    return () => { cancelled = true; };
  }, [leave.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Substitute Plan — {leave.staffName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {rows === null ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">No substitute plan recorded for this leave.</p>
          ) : rows.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{formatDate(a.period.date)} · {a.period.day} · Period {a.period.period} <span className="text-gray-400 dark:text-zinc-500 font-normal">({a.period.time})</span></p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Class {a.period.classSection} · {a.period.subject}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                <UserCog className="h-3 w-3" /> {a.substituteName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaveDetailModal({
  leave, showSubstituteLink, onClose, onApprove, onReject, onViewSubstitutes,
}: {
  leave: Leave;
  showSubstituteLink: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewSubstitutes: () => void;
}) {
  const statusBadge    = STATUS_BADGE[leave.status];
  const leaveTypeBadge = LEAVE_TYPE_BADGE[leave.leaveType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(leave.id)}`}>{initials(leave.staffName)}</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{leave.staffName}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{leave.role} · {leave.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${leaveTypeBadge}`}>{LEAVE_TYPE_LABEL[leave.leaveType]}</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
            {leave.approvedBy && <span className="text-[11px] text-gray-400 dark:text-zinc-500">by {leave.approvedBy}</span>}
          </div>

          <SchoolTag name={leave.schoolName} />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500"><CalendarDays className="h-3 w-3"/> Duration</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-zinc-100">
                {formatDate(leave.from)}{leave.from !== leave.to ? ` → ${formatDate(leave.to)}` : ""}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{leave.days} day{leave.days === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500"><Clock className="h-3 w-3"/> Applied On</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-zinc-100">{formatDate(leave.appliedOn)}</p>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500"><FileText className="h-3 w-3"/> Reason</p>
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-700 dark:text-zinc-300">
              {leave.reason || "No reason provided."}
            </p>
          </div>

          {leave.personType === "student" && (
            <Link href={`/dashboard/students/${leave.studentId}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> View student profile
            </Link>
          )}

          {showSubstituteLink && (
            <button onClick={onViewSubstitutes} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              <UserCog className="h-3.5 w-3.5" /> View substitute plan
            </button>
          )}
        </div>

        {leave.status === "pending" && (
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
            <button onClick={onReject} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
              <Ban className="h-3.5 w-3.5" /> Reject
            </button>
            <FancyButton onClick={onApprove} size="sm">
              <Check className="h-3.5 w-3.5" /> Approve
            </FancyButton>
          </div>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;
const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" },
];

export default function LeaveRequestsPanel({ initialLeaves, schools }: { initialLeaves: Leave[]; schools: SchoolOption[] }) {
  const [leaves,     setLeaves]    = useState(initialLeaves);
  const [tab,        setTab]       = useState<TabFilter>("pending");
  const [personFilter, setPersonFilter] = useState<PersonFilter>("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [query,      setQuery]     = useState("");
  const [typeFilter, setType]      = useState<"all"|LeaveType>("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo,   setAppliedTo]   = useState("");
  const [leaveFrom,   setLeaveFrom]   = useState("");
  const [leaveTo,     setLeaveTo]     = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [sortField,  setSortField] = useState<SortField>("appliedOn");
  const [sortDir,    setSortDir]   = useState<SortDir>("desc");
  const [page,       setPage]      = useState(1);
  const [assignModalFor, setAssignModalFor] = useState<Leave | null>(null);
  const [viewModalFor,   setViewModalFor]   = useState<Leave | null>(null);
  const [detailFor,      setDetailFor]      = useState<Leave | null>(null);
  const [, startTransition] = useTransition();

  async function persistStatus(leave: Leave, status: "approved"|"rejected") {
    if (leave.personType === "student") {
      await updateStudentLeaveStatus(leave.id, leave.studentId!, status);
    } else {
      await updateLeaveStatus(leave.id, status);
    }
  }

  function reject(leave: Leave) {
    setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status: "rejected" } : l)));
    startTransition(async () => { await persistStatus(leave, "rejected"); });
  }

  function approve(leave: Leave) {
    if (leave.personType === "staff" && leave.role === "Teacher") {
      setAssignModalFor(leave);
      return;
    }
    setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status: "approved" } : l)));
    startTransition(async () => { await persistStatus(leave, "approved"); });
  }

  function confirmSubstitutes() {
    if (!assignModalFor) return;
    setLeaves((prev) => prev.map((l) => (l.id === assignModalFor.id ? { ...l, status: "approved" } : l)));
    startTransition(async () => { await persistStatus(assignModalFor, "approved"); });
    setAssignModalFor(null);
  }

  function canHaveSubstitutePlan(leave: Leave) {
    return leave.status === "approved" && leave.personType === "staff" && leave.role === "Teacher";
  }

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  useEffect(() => {
    if (!filtersOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (filtersRef.current && filtersRef.current.contains(target)) return;
      if (target instanceof Element && target.closest('[data-slot="date-picker-popup"]')) return;
      setFiltersOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filtersOpen]);

  const deptOptions = useMemo(
    () => Array.from(new Set(leaves.map((l)=>l.department).filter(Boolean))).sort(),
    [leaves]
  );
  const roleOptions = useMemo(
    () => Array.from(new Set(leaves.map((l)=>l.role).filter(Boolean))).sort(),
    [leaves]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leaves.filter((l) => {
      const matchTab    = tab==="all"||l.status===tab;
      const matchPerson = personFilter==="all"||l.personType===personFilter;
      const matchSchool = schoolFilter==="all"||l.schoolId===schoolFilter;
      const matchType   = typeFilter==="all"||l.leaveType===typeFilter;
      const matchDept   = deptFilter==="all"||l.department===deptFilter;
      const matchRole   = roleFilter==="all"||l.role===roleFilter;
      const matchApplied = (!appliedFrom||l.appliedOn>=appliedFrom)&&(!appliedTo||l.appliedOn<=appliedTo);
      const matchLeave    = (!leaveFrom||l.to>=leaveFrom)&&(!leaveTo||l.from<=leaveTo);
      const matchQ      = !q||l.staffName.toLowerCase().includes(q)||l.department.toLowerCase().includes(q)||l.reason.toLowerCase().includes(q);
      return matchTab&&matchPerson&&matchSchool&&matchType&&matchDept&&matchRole&&matchApplied&&matchLeave&&matchQ;
    }).sort((a,b) => {
      let cmp=0;
      if (sortField==="staffName")  cmp=a.staffName.localeCompare(b.staffName);
      if (sortField==="department") cmp=a.department.localeCompare(b.department);
      if (sortField==="from")       cmp=a.from.localeCompare(b.from);
      if (sortField==="days")       cmp=a.days-b.days;
      if (sortField==="appliedOn")  cmp=a.appliedOn.localeCompare(b.appliedOn);
      if (sortField==="status")     cmp=a.status.localeCompare(b.status);
      return sortDir==="asc"?cmp:-cmp;
    });
  }, [tab, personFilter, schoolFilter, query, typeFilter, deptFilter, roleFilter, appliedFrom, appliedTo, leaveFrom, leaveTo, sortField, sortDir, leaves]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const advancedCount = [deptFilter!=="all", roleFilter!=="all", !!(appliedFrom||appliedTo), !!(leaveFrom||leaveTo)].filter(Boolean).length;
  const hasFilter  = !!(query||typeFilter!=="all"||advancedCount>0);
  function clearFilters() {
    setQuery(""); setType("all"); setDeptFilter("all"); setRoleFilter("all");
    setAppliedFrom(""); setAppliedTo(""); setLeaveFrom(""); setLeaveTo("");
    setPage(1);
  }
  const staffCount   = leaves.filter((l)=>l.personType==="staff").length;
  const studentCount = leaves.filter((l)=>l.personType==="student").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search name, department/class or reason…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={schoolFilter} onChange={(e)=>{setSchoolFilter(e.target.value);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Schools</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e)=>{setType(e.target.value as "all"|LeaveType);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Types</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="earned">Earned Leave</option><option value="maternity">Maternity Leave</option><option value="emergency">Emergency Leave</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={personFilter} onChange={(e)=>{setPersonFilter(e.target.value as PersonFilter);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All</option>
            <option value="staff">Staff ({staffCount})</option>
            <option value="student">Students ({studentCount})</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>

        <div className="flex h-9 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 overflow-x-auto">
          {TABS.map(({id,label}) => (
            <button key={id} onClick={()=>{setTab(id);setPage(1);}} className={`flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${tab===id?"bg-primary-500 text-white shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {label}
              <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-[8px] ${tab===id?"bg-white/20 text-white":"bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                {id==="all"?leaves.length:leaves.filter((l)=>l.status===id).length}
              </span>
            </button>
          ))}
        </div>

        <div ref={filtersRef} className="relative shrink-0">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors ${advancedCount>0?"border-primary-300 dark:border-primary-500/40 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300":"border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5"/> Filters
            {advancedCount>0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">{advancedCount}</span>}
          </button>

          {filtersOpen && (
            <div className="absolute right-0 z-20 mt-2 w-[19rem] rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-lg">
              <div className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Department / Class</label>
                  <div className="relative">
                    <select value={deptFilter} onChange={(e)=>{setDeptFilter(e.target.value);setPage(1);}} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                      <option value="all">All Departments / Classes</option>
                      {deptOptions.map((d)=>(<option key={d} value={d}>{d}</option>))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Role</label>
                  <div className="relative">
                    <select value={roleFilter} onChange={(e)=>{setRoleFilter(e.target.value);setPage(1);}} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                      <option value="all">All Roles</option>
                      {roleOptions.map((r)=>(<option key={r} value={r}>{r}</option>))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Applied On</label>
                  <div className="flex items-center gap-2">
                    <DatePicker value={appliedFrom} onChange={(v)=>{setAppliedFrom(v);setPage(1);}} className="min-w-0 px-2 text-xs" />
                    <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
                    <DatePicker value={appliedTo} onChange={(v)=>{setAppliedTo(v);setPage(1);}} className="min-w-0 px-2 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">On Leave During</label>
                  <div className="flex items-center gap-2">
                    <DatePicker value={leaveFrom} onChange={(v)=>{setLeaveFrom(v);setPage(1);}} className="min-w-0 px-2 text-xs" />
                    <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
                    <DatePicker value={leaveTo} onChange={(v)=>{setLeaveTo(v);setPage(1);}} className="min-w-0 px-2 text-xs" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-3">
                <button
                  onClick={() => { setDeptFilter("all"); setRoleFilter("all"); setAppliedFrom(""); setAppliedTo(""); setLeaveFrom(""); setLeaveTo(""); setPage(1); }}
                  disabled={advancedCount===0}
                  className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 disabled:opacity-40 disabled:hover:text-gray-500"
                >
                  Reset
                </button>
                <FancyButton onClick={() => setFiltersOpen(false)} size="xs">
                  Done
                </FancyButton>
              </div>
            </div>
          )}
        </div>

        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      {hasFilter&&(
        <div className="flex flex-wrap items-center gap-1.5">
          {query&&(
            <button onClick={()=>{setQuery("");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              &ldquo;{query}&rdquo; <X className="h-3 w-3"/>
            </button>
          )}
          {typeFilter!=="all"&&(
            <button onClick={()=>{setType("all");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              {LEAVE_TYPE_LABEL[typeFilter]} <X className="h-3 w-3"/>
            </button>
          )}
          {deptFilter!=="all"&&(
            <button onClick={()=>{setDeptFilter("all");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              {deptFilter} <X className="h-3 w-3"/>
            </button>
          )}
          {roleFilter!=="all"&&(
            <button onClick={()=>{setRoleFilter("all");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              {roleFilter} <X className="h-3 w-3"/>
            </button>
          )}
          {(appliedFrom||appliedTo)&&(
            <button onClick={()=>{setAppliedFrom("");setAppliedTo("");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              Applied {appliedFrom?formatDate(appliedFrom):"…"} → {appliedTo?formatDate(appliedTo):"…"} <X className="h-3 w-3"/>
            </button>
          )}
          {(leaveFrom||leaveTo)&&(
            <button onClick={()=>{setLeaveFrom("");setLeaveTo("");setPage(1);}} className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 pl-2.5 pr-1.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
              On leave {leaveFrom?formatDate(leaveFrom):"…"} → {leaveTo?formatDate(leaveTo):"…"} <X className="h-3 w-3"/>
            </button>
          )}
        </div>
      )}

      <Table
        footer={totalPages>1&&(
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> requests</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first"><button onClick={()=>toggleSort("staffName")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Name <SortIcon active={sortField==="staffName"} dir={sortDir}/></button></Th>
          <Th>School</Th>
          <Th><button onClick={()=>toggleSort("department")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Department / Class <SortIcon active={sortField==="department"} dir={sortDir}/></button></Th>
          <Th>Leave Type</Th>
          <Th><button onClick={()=>toggleSort("from")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Duration <SortIcon active={sortField==="from"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("days")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Days <SortIcon active={sortField==="days"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("appliedOn")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Applied On <SortIcon active={sortField==="appliedOn"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("status")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon active={sortField==="status"} dir={sortDir}/></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length===0?(
            <TableEmptyRow colSpan={9} icon={CalendarOff} message="No leave requests found" />
          ):pageData.map((leave) => {
            const statusBadge    = STATUS_BADGE[leave.status];
            const leaveTypeBadge = LEAVE_TYPE_BADGE[leave.leaveType];
            const isPending      = leave.status==="pending";
            return (
              <Tr key={leave.id} className={isPending?"bg-amber-50/30 dark:bg-amber-500/5":""}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(leave.id)}`}>{initials(leave.staffName)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{leave.staffName}</p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">{leave.role}</p>
                    </div>
                  </div>
                </Td>
                <Td><SchoolTag name={leave.schoolName} /></Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{leave.department}</Td>
                <Td><span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${leaveTypeBadge}`}>{LEAVE_TYPE_LABEL[leave.leaveType]}</span></Td>
                <Td><p className="text-sm font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(leave.from)}</p>{leave.from!==leave.to&&<p className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">→ {formatDate(leave.to)}</p>}</Td>
                <Td><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary-500/10 text-xs font-bold text-primary-700 dark:text-primary-300">{leave.days}</span></Td>
                <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{formatDate(leave.appliedOn)}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
                  {leave.approvedBy&&<p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">by {leave.approvedBy}</p>}
                </Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={()=>setDetailFor(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="View details"><Eye className="h-3.5 w-3.5"/></button>
                    {canHaveSubstitutePlan(leave)&&<button onClick={()=>setViewModalFor(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="View substitutes"><Users className="h-3.5 w-3.5"/></button>}
                    {isPending&&<><button onClick={()=>approve(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Approve"><Check className="h-3.5 w-3.5"/></button><button onClick={()=>reject(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Reject"><Ban className="h-3.5 w-3.5"/></button></>}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {assignModalFor && (
        <SubstituteAssignModal
          leave={assignModalFor}
          onClose={() => setAssignModalFor(null)}
          onConfirm={confirmSubstitutes}
        />
      )}
      {viewModalFor && (
        <SubstituteViewModal
          leave={viewModalFor}
          onClose={() => setViewModalFor(null)}
        />
      )}
      {detailFor && (
        <LeaveDetailModal
          leave={detailFor}
          showSubstituteLink={canHaveSubstitutePlan(detailFor)}
          onClose={() => setDetailFor(null)}
          onApprove={() => { approve(detailFor); setDetailFor(null); }}
          onReject={() => { reject(detailFor); setDetailFor(null); }}
          onViewSubstitutes={() => { setViewModalFor(detailFor); setDetailFor(null); }}
        />
      )}
    </div>
  );
}
