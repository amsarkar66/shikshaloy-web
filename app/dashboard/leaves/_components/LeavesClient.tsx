"use client";

import { useState, useMemo } from "react";
import {
  CalendarOff, Clock, CheckCircle2, XCircle, Search, Plus,
  Download, X, Eye, Check, Ban, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { STATUS_BADGE, LEAVE_TYPE_LABEL, LEAVE_TYPE_BADGE, formatDate } from "../_data/leaves";
import type { LeaveStatus, LeaveType } from "../_data/leaves";
import { generateAffectedPeriods, AVAILABLE_TEACHERS, type Period } from "../_data/substitutes";
import { Users, UserCog } from "lucide-react";

export interface Leave {
  id: string;
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

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase(); }

type SortField = "staffName"|"department"|"from"|"days"|"appliedOn"|"status";
type SortDir = "asc"|"desc";
type TabFilter = "all"|LeaveStatus;

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
              <select
                value={assignments[i]}
                onChange={(e) => setAssignments((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
                className="h-9 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select substitute…</option>
                {AVAILABLE_TEACHERS.filter((t) => t !== leave.staffName).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allAssigned}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 px-4 text-sm font-medium text-white transition-colors"
          >
            <Check className="h-4 w-4" /> Confirm &amp; Approve
          </button>
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <UserCog className="h-3 w-3" /> {a.substitute}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;
const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" },
];

export default function LeavesClient({ initialLeaves }: { initialLeaves: Leave[] }) {
  const [leaves,     setLeaves]    = useState(initialLeaves);
  const [tab,        setTab]       = useState<TabFilter>("all");
  const [query,      setQuery]     = useState("");
  const [typeFilter, setType]      = useState<"all"|LeaveType>("all");
  const [sortField,  setSortField] = useState<SortField>("appliedOn");
  const [sortDir,    setSortDir]   = useState<SortDir>("desc");
  const [page,       setPage]      = useState(1);
  const [subPlans,      setSubPlans]      = useState<Record<string, SubstitutePlan[]>>({});
  const [assignModalFor, setAssignModalFor] = useState<Leave | null>(null);
  const [viewModalFor,   setViewModalFor]   = useState<Leave | null>(null);

  function reject(leave: Leave) {
    setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status: "rejected", approvedBy: "Principal" } : l)));
  }

  function approve(leave: Leave) {
    if (leave.role === "Teacher") {
      setAssignModalFor(leave);
      return;
    }
    setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status: "approved", approvedBy: "Principal" } : l)));
  }

  function confirmSubstitutes(plan: SubstitutePlan[]) {
    if (!assignModalFor) return;
    setSubPlans((prev) => ({ ...prev, [assignModalFor.id]: plan }));
    setLeaves((prev) => prev.map((l) => (l.id === assignModalFor.id ? { ...l, status: "approved", approvedBy: "Principal" } : l)));
    setAssignModalFor(null);
  }

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leaves.filter((l) => {
      const matchTab  = tab==="all"||l.status===tab;
      const matchType = typeFilter==="all"||l.leaveType===typeFilter;
      const matchQ    = !q||l.staffName.toLowerCase().includes(q)||l.department.toLowerCase().includes(q)||l.reason.toLowerCase().includes(q);
      return matchTab&&matchType&&matchQ;
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
  }, [tab, query, typeFilter, sortField, sortDir, leaves]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasFilter  = query||typeFilter!=="all";
  function clearFilters() { setQuery(""); setType("all"); setPage(1); }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Leave Management</h1><p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Review and approve staff leave requests</p></div>
        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors"><Plus className="h-4 w-4"/> New Request</button>
        </div>
      </div>

      <StatsRow leaves={leaves} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({id,label}) => (
          <button key={id} onClick={()=>{setTab(id);setPage(1);}} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===id?"border-indigo-500 text-indigo-600 dark:text-indigo-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            {label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab===id?"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>
              {id==="all"?leaves.length:leaves.filter((l)=>l.status===id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search staff name, department or reason…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"/>
        </div>
        <select value={typeFilter} onChange={(e)=>{setType(e.target.value as "all"|LeaveType);setPage(1);}} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
          <option value="all">All Types</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="earned">Earned Leave</option><option value="maternity">Maternity Leave</option><option value="emergency">Emergency Leave</option>
        </select>
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{leaves.length}</span> requests</p>
        {hasFilter&&<span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left"><button onClick={()=>toggleSort("staffName")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Staff <SortIcon active={sortField==="staffName"} dir={sortDir}/></button></th>
                <th className="px-3 py-3 text-left"><button onClick={()=>toggleSort("department")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Department <SortIcon active={sortField==="department"} dir={sortDir}/></button></th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Leave Type</th>
                <th className="px-3 py-3 text-left"><button onClick={()=>toggleSort("from")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Duration <SortIcon active={sortField==="from"} dir={sortDir}/></button></th>
                <th className="px-3 py-3 text-left"><button onClick={()=>toggleSort("days")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Days <SortIcon active={sortField==="days"} dir={sortDir}/></button></th>
                <th className="px-3 py-3 text-left"><button onClick={()=>toggleSort("appliedOn")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Applied On <SortIcon active={sortField==="appliedOn"} dir={sortDir}/></button></th>
                <th className="px-3 py-3 text-left"><button onClick={()=>toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon active={sortField==="status"} dir={sortDir}/></button></th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length===0?(
                <tr><td colSpan={8} className="py-20 text-center"><div className="flex flex-col items-center gap-2"><CalendarOff className="h-8 w-8 text-gray-300 dark:text-zinc-600"/><p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No leave requests found</p></div></td></tr>
              ):pageData.map((leave) => {
                const statusBadge    = STATUS_BADGE[leave.status];
                const leaveTypeBadge = LEAVE_TYPE_BADGE[leave.leaveType];
                const isPending      = leave.status==="pending";
                return (
                  <tr key={leave.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${isPending?"bg-amber-50/30 dark:bg-amber-500/5":""}`}>
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(leave.id)}`}>{initials(leave.staffName)}</div>
                        <div className="min-w-0"><p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{leave.staffName}</p><p className="text-xs text-gray-400 dark:text-zinc-500">{leave.role}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{leave.department}</td>
                    <td className="px-3 py-3"><span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${leaveTypeBadge}`}>{LEAVE_TYPE_LABEL[leave.leaveType]}</span></td>
                    <td className="px-3 py-3"><p className="text-sm font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(leave.from)}</p>{leave.from!==leave.to&&<p className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">→ {formatDate(leave.to)}</p>}</td>
                    <td className="px-3 py-3"><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-700 dark:text-indigo-300">{leave.days}</span></td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{formatDate(leave.appliedOn)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
                      {leave.approvedBy&&<p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">by {leave.approvedBy}</p>}
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="View"><Eye className="h-3.5 w-3.5"/></button>
                        {subPlans[leave.id]&&<button onClick={()=>setViewModalFor(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="View substitutes"><Users className="h-3.5 w-3.5"/></button>}
                        {isPending&&<><button onClick={()=>approve(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Approve"><Check className="h-3.5 w-3.5"/></button><button onClick={()=>reject(leave)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Reject"><Ban className="h-3.5 w-3.5"/></button></>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-indigo-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
