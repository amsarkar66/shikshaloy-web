"use client";

import { useState, useTransition } from "react";
import { CalendarOff, Clock, CheckCircle2, XCircle, Plus, X, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { STATUS_BADGE, LEAVE_TYPE_LABEL, LEAVE_TYPE_BADGE, formatDate, type LeaveType, type LeaveStatus } from "../_data/leaves";
import { applyLeave } from "../actions";

export interface MyLeave {
  id: string;
  leaveType: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}

function StatsRow({ leaves }: { leaves: MyLeave[] }) {
  const items = [
    { label: "Total Requests",   value: leaves.length,                                     icon: CalendarOff,  accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Pending",          value: leaves.filter((l) => l.status === "pending").length,  icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Approved",         value: leaves.filter((l) => l.status === "approved").length, icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Rejected",         value: leaves.filter((l) => l.status === "rejected").length, icon: XCircle,      accent: "text-red-500     bg-red-500/10"     },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

function ApplyModal({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !reason) return;
    startTransition(async () => {
      await applyLeave({ staffId, leaveType, from, to, reason });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Apply for Leave</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Leave Type</label>
            <div className="relative">
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((t) => <option key={t} value={t}>{LEAVE_TYPE_LABEL[t]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">From</label>
              <DatePicker value={from} onChange={setFrom} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">To</label>
              <DatePicker value={to} onChange={setTo} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">{isPending ? "Submitting…" : "Submit Request"}</FancyButton>
        </div>
      </form>
    </div>
  );
}

export default function MyLeavesClient({ staffId, leaves }: { staffId: string; leaves: MyLeave[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Leave Requests</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Apply for leave and track your requests</p>
        </div>
        <FancyButton onClick={() => setOpen(true)} size="sm">
          <Plus className="h-4 w-4" /> Apply for Leave
        </FancyButton>
      </div>

      <StatsRow leaves={leaves} />

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {leaves.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarOff className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No leave requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center gap-4 px-4 py-3">
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${LEAVE_TYPE_BADGE[l.leaveType]}`}>{LEAVE_TYPE_LABEL[l.leaveType]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-zinc-100">{formatDate(l.from)} – {formatDate(l.to)} <span className="text-gray-400 dark:text-zinc-500">({l.days} day{l.days !== 1 ? "s" : ""})</span></p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{l.reason}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[l.status].cls}`}>{STATUS_BADGE[l.status].label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && <ApplyModal staffId={staffId} onClose={() => setOpen(false)} />}
    </div>
  );
}
