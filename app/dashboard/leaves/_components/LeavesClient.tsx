"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import {
  CalendarOff, Clock, CheckCircle2, XCircle, Search, Plus,
  Download, X, Eye, Check, Ban, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronDown, FileText, CalendarDays, ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { STATUS_BADGE, LEAVE_TYPE_LABEL, LEAVE_TYPE_BADGE, formatDate } from "../_data/leaves";
import type { LeaveStatus, LeaveType } from "../_data/leaves";
import { generateAffectedPeriods, AVAILABLE_TEACHERS, type Period } from "../_data/substitutes";
import { updateLeaveStatus, applyLeave } from "../actions";
import { updateStudentLeaveStatus, applyStudentLeave } from "../../students/actions";
import { Users, UserCog, GraduationCap, Briefcase } from "lucide-react";
import Link from "next/link";

export type PersonType = "staff" | "student";

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
}

export interface StaffOption {
  id: string;
  name: string;
  role: string;
  department: string;
}

export interface StudentOption {
  id: string;
  name: string;
  classLabel: string;
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

function StatsRow({ leaves }: { leaves: Leave[] }) {
  const total    = leaves.length;
  const pending  = leaves.filter((l)=>l.status==="pending").length;
  const approved = leaves.filter((l)=>l.status==="approved").length;
  const rejected = leaves.filter((l)=>l.status==="rejected").length;
  const items = [
    { label: "Total Requests",   value: total,    icon: CalendarOff,  accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Pending Approval", value: pending,  icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Approved",         value: approved, icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Rejected",         value: rejected, icon: XCircle,      accent: "text-red-500     bg-red-500/10"     },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5"/></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

export interface SubstitutePlan {
  period: Period;
  substitute: string;
}

function SubstituteAssignModal({
  leave, onClose, onConfirm,
}: {
  leave: Leave;
  onClose: () => void;
  onConfirm: (plan: SubstitutePlan[]) => void;
}) {
  const periods = useMemo(
    () => generateAffectedPeriods(leave.id, leave.department, leave.from, leave.to),
    [leave.id, leave.department, leave.from, leave.to]
  );
  const [assignments, setAssignments] = useState<string[]>(() => periods.map(() => ""));

  const allAssigned = assignments.every((a) => a !== "");

  function handleConfirm() {
    onConfirm(periods.map((period, i) => ({ period, substitute: assignments[i] })));
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
            {formatDate(leave.from)}{leave.from !== leave.to ? ` → ${formatDate(leave.to)}` : ""} · {periods.length} affected period{periods.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {periods.map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{p.day} · Period {p.period} <span className="text-gray-400 dark:text-zinc-500 font-normal">({p.time})</span></p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Class {p.classSection} · {p.subject}</p>
              </div>
              <div className="relative shrink-0">
                <select
                  value={assignments[i]}
                  onChange={(e) => setAssignments((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
                  className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Select substitute…</option>
                  {AVAILABLE_TEACHERS.filter((t) => t !== leave.staffName).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton
            onClick={handleConfirm}
            disabled={!allAssigned}
            size="sm"
          >
            <Check className="h-4 w-4" /> Confirm &amp; Approve
          </FancyButton>
        </div>
      </div>
    </div>
  );
}

function SubstituteViewModal({ leave, plan, onClose }: { leave: Leave; plan: SubstitutePlan[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Substitute Plan — {leave.staffName}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {plan.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{a.period.day} · Period {a.period.period} <span className="text-gray-400 dark:text-zinc-500 font-normal">({a.period.time})</span></p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Class {a.period.classSection} · {a.period.subject}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                <UserCog className="h-3 w-3" /> {a.substitute}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaveDetailModal({
  leave, subPlan, onClose, onApprove, onReject, onViewSubstitutes,
}: {
  leave: Leave;
  subPlan?: SubstitutePlan[];
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

          {subPlan && (
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

function NewLeaveRequestModal({
  staffOptions, studentOptions, onClose, onCreated,
}: {
  staffOptions: StaffOption[];
  studentOptions: StudentOption[];
  onClose: () => void;
  onCreated: (leave: Leave) => void;
}) {
  const [personType, setPersonType] = useState<PersonType>("staff");
  const [personId, setPersonId]     = useState("");
  const [leaveType, setLeaveType]   = useState<LeaveType>("casual");
  const [from, setFrom]             = useState("");
  const [to, setTo]                 = useState("");
  const [reason, setReason]         = useState("");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const options = personType === "staff" ? staffOptions : studentOptions;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personId || !from || !to || !reason.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (personType === "staff") {
        const staff = staffOptions.find((s) => s.id === personId);
        if (!staff) throw new Error("Please select a staff member.");
        const result = await applyLeave({ staffId: personId, leaveType, from, to, reason: reason.trim() });
        onCreated({
          id: result.id, personType: "staff",
          staffName: staff.name, role: staff.role, department: staff.department,
          leaveType, from, to, days: result.days, reason: reason.trim(),
          status: "pending", appliedOn: today,
        });
      } else {
        const student = studentOptions.find((s) => s.id === personId);
        if (!student) throw new Error("Please select a student.");
        const result = await applyStudentLeave({ studentId: personId, leaveType, from, to, reason: reason.trim() });
        onCreated({
          id: result.id, personType: "student", studentId: personId,
          staffName: student.name, role: "Student", department: student.classLabel,
          leaveType, from, to, days: result.days, reason: reason.trim(),
          status: "pending", appliedOn: today,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">New Leave Request</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => { setPersonType("staff"); setPersonId(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${personType === "staff" ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Staff
            </button>
            <button
              type="button"
              onClick={() => { setPersonType("student"); setPersonId(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${personType === "student" ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Student
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">{personType === "staff" ? "Staff Member" : "Student"}</label>
            <div className="relative">
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                required
                className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select {personType === "staff" ? "a staff member" : "a student"}…</option>
                {personType === "staff"
                  ? staffOptions.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.department}</option>)
                  : studentOptions.map((o) => <option key={o.id} value={o.id}>{o.name} — Class {o.classLabel}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
            {options.length === 0 && (
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">No {personType === "staff" ? "active staff" : "active students"} found.</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Leave Type</label>
            <div className="relative">
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              >
                {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((t) => <option key={t} value={t}>{LEAVE_TYPE_LABEL[t]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={busy} size="sm">{busy ? "Submitting…" : "Submit Request"}</FancyButton>
        </div>
      </form>
    </div>
  );
}

const PAGE_SIZE = 10;
const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" },
];

export default function LeavesClient({ initialLeaves, staffOptions, studentOptions }: { initialLeaves: Leave[]; staffOptions: StaffOption[]; studentOptions: StudentOption[] }) {
  const [leaves,     setLeaves]    = useState(initialLeaves);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [tab,        setTab]       = useState<TabFilter>("all");
  const [personFilter, setPersonFilter] = useState<PersonFilter>("all");
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
  const [subPlans,      setSubPlans]      = useState<Record<string, SubstitutePlan[]>>({});
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

  function confirmSubstitutes(plan: SubstitutePlan[]) {
    if (!assignModalFor) return;
    setSubPlans((prev) => ({ ...prev, [assignModalFor.id]: plan }));
    setLeaves((prev) => prev.map((l) => (l.id === assignModalFor.id ? { ...l, status: "approved" } : l)));
    startTransition(async () => { await persistStatus(assignModalFor, "approved"); });
    setAssignModalFor(null);
  }

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  useEffect(() => {
    if (!filtersOpen) return;
    function handleClick(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false);
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
      const matchType   = typeFilter==="all"||l.leaveType===typeFilter;
      const matchDept   = deptFilter==="all"||l.department===deptFilter;
      const matchRole   = roleFilter==="all"||l.role===roleFilter;
      const matchApplied = (!appliedFrom||l.appliedOn>=appliedFrom)&&(!appliedTo||l.appliedOn<=appliedTo);
      const matchLeave    = (!leaveFrom||l.to>=leaveFrom)&&(!leaveTo||l.from<=leaveTo);
      const matchQ      = !q||l.staffName.toLowerCase().includes(q)||l.department.toLowerCase().includes(q)||l.reason.toLowerCase().includes(q);
      return matchTab&&matchPerson&&matchType&&matchDept&&matchRole&&matchApplied&&matchLeave&&matchQ;
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
  }, [tab, personFilter, query, typeFilter, deptFilter, roleFilter, appliedFrom, appliedTo, leaveFrom, leaveTo, sortField, sortDir, leaves]);

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
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Leave Management</h1><p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Review and approve staff &amp; student leave requests</p></div>
        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <FancyButton onClick={() => setNewRequestOpen(true)} size="sm"><Plus className="h-4 w-4"/> New Request</FancyButton>
        </div>
      </div>

      <StatsRow leaves={leaves} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({id,label}) => (
          <button key={id} onClick={()=>{setTab(id);setPage(1);}} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===id?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            {label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab===id?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>
              {id==="all"?leaves.length:leaves.filter((l)=>l.status===id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search name, department/class or reason…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e)=>{setType(e.target.value as "all"|LeaveType);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Types</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="earned">Earned Leave</option><option value="maternity">Maternity Leave</option><option value="emergency">Emergency Leave</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-1">
          {([
            { id: "all" as PersonFilter, label: "All", icon: null },
            { id: "staff" as PersonFilter, label: `Staff (${staffCount})`, icon: Briefcase },
            { id: "student" as PersonFilter, label: `Students (${studentCount})`, icon: GraduationCap },
          ]).map(({id,label,icon:Icon}) => (
            <button key={id} onClick={()=>{setPersonFilter(id);setPage(1);}} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${personFilter===id?"bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}>
              {Icon&&<Icon className="h-3.5 w-3.5"/>}{label}
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
                    <input type="date" value={appliedFrom} onChange={(e)=>{setAppliedFrom(e.target.value);setPage(1);}} className="h-9 w-full min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
                    <input type="date" value={appliedTo} onChange={(e)=>{setAppliedTo(e.target.value);setPage(1);}} className="h-9 w-full min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">On Leave During</label>
                  <div className="flex items-center gap-2">
                    <input type="date" value={leaveFrom} onChange={(e)=>{setLeaveFrom(e.target.value);setPage(1);}} className="h-9 w-full min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
                    <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
                    <input type="date" value={leaveTo} onChange={(e)=>{setLeaveTo(e.target.value);setPage(1);}} className="h-9 w-full min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
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
              “{query}” <X className="h-3 w-3"/>
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
          <Th position="first"><button onClick={()=>toggleSort("staffName")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Name <SortIcon active={sortField==="staffName"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("department")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Department / Class <SortIcon active={sortField==="department"} dir={sortDir}/></button></Th>
          <Th>Leave Type</Th>
          <Th><button onClick={()=>toggleSort("from")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Duration <SortIcon active={sortField==="from"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("days")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Days <SortIcon active={sortField==="days"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("appliedOn")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Applied On <SortIcon active={sortField==="appliedOn"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon active={sortField==="status"} dir={sortDir}/></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length===0?(
            <TableEmptyRow colSpan={8} icon={CalendarOff} message="No leave requests found" />
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
                    {subPlans[leave.id]&&<button onClick={()=>setViewModalFor(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="View substitutes"><Users className="h-3.5 w-3.5"/></button>}
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
      {viewModalFor && subPlans[viewModalFor.id] && (
        <SubstituteViewModal
          leave={viewModalFor}
          plan={subPlans[viewModalFor.id]}
          onClose={() => setViewModalFor(null)}
        />
      )}
      {detailFor && (
        <LeaveDetailModal
          leave={detailFor}
          subPlan={subPlans[detailFor.id]}
          onClose={() => setDetailFor(null)}
          onApprove={() => { approve(detailFor); setDetailFor(null); }}
          onReject={() => { reject(detailFor); setDetailFor(null); }}
          onViewSubstitutes={() => { setViewModalFor(detailFor); setDetailFor(null); }}
        />
      )}
      {newRequestOpen && (
        <NewLeaveRequestModal
          staffOptions={staffOptions}
          studentOptions={studentOptions}
          onClose={() => setNewRequestOpen(false)}
          onCreated={(leave) => { setLeaves((prev) => [leave, ...prev]); setPage(1); }}
        />
      )}
    </div>
  );
}
