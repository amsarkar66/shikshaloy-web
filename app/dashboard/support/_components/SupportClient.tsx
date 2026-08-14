"use client";

import { useState, useMemo, useTransition } from "react";
import {
  MessageSquareWarning, Clock, Eye, CheckCircle2, Search,
  ChevronDown, ChevronUp, Mail, Phone, Loader2, Building2,
} from "lucide-react";
import { updateGrievanceStatus, type GrievanceStatus } from "@/app/dashboard/grievances/actions";

export interface PlatformGrievance {
  id: string;
  schoolName: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: GrievanceStatus;
  resolutionNotes: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

const STATUS_BADGE: Record<GrievanceStatus, string> = {
  open: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  in_review: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  resolved: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

const CATEGORY_LABEL: Record<string, string> = {
  academic: "Academic",
  facilities: "Facilities",
  transport: "Transport",
  fees: "Fees",
  staff: "Staff",
  other: "Other",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatsRow({ grievances }: { grievances: PlatformGrievance[] }) {
  const total = grievances.length;
  const open = grievances.filter((g) => g.status === "open").length;
  const inReview = grievances.filter((g) => g.status === "in_review").length;
  const resolved = grievances.filter((g) => g.status === "resolved").length;
  const items = [
    { label: "Total",      value: total,    icon: MessageSquareWarning, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Open",       value: open,     icon: Clock,                accent: "text-amber-500   bg-amber-500/10"   },
    { label: "In Review",  value: inReview, icon: Eye,                  accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Resolved",   value: resolved, icon: CheckCircle2,         accent: "text-emerald-500 bg-emerald-500/10" },
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

function GrievanceCard({ grievance }: { grievance: PlatformGrievance }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(grievance.status);
  const [notes, setNotes] = useState(grievance.resolutionNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSetStatus(next: GrievanceStatus) {
    setError(null);
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await updateGrievanceStatus(grievance.id, next, notes);
      } catch (err) {
        setStatus(prev);
        setError(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{grievance.subject}</h3>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[status]}`}>
                {STATUS_LABEL[status]}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
                {CATEGORY_LABEL[grievance.category] ?? grievance.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">
                <Building2 className="h-2.5 w-2.5" /> {grievance.schoolName}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-400 dark:text-zinc-500">
              <span>{grievance.name}</span>
              {grievance.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{grievance.email}</span>}
              {grievance.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{grievance.phone}</span>}
              <span>{formatDate(grievance.createdAt)}</span>
            </div>
          </div>
        </div>

        <p className={`text-sm text-gray-600 dark:text-zinc-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
          {grievance.message}
        </p>
        {grievance.message.length > 120 && (
          <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-0.5 text-xs text-primary-600 dark:text-primary-400 hover:underline">
            {expanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Read more</>}
          </button>
        )}

        {expanded && (
          <div className="pt-2 space-y-2 border-t border-gray-100 dark:border-zinc-700/50">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes (optional)…"
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex items-center gap-1.5">
              {(["open", "in_review", "resolved"] as GrievanceStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSetStatus(s)}
                  disabled={pending || status === s}
                  className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    status === s ? STATUS_BADGE[s] : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Mark {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_TABS: { value: GrievanceStatus | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "open",      label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved",  label: "Resolved" },
];

export default function SupportClient({ initialData }: { initialData: PlatformGrievance[] }) {
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<GrievanceStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialData.filter((g) => {
      const matchQ = !q || g.subject.toLowerCase().includes(q) || g.message.toLowerCase().includes(q) || g.name.toLowerCase().includes(q) || g.schoolName.toLowerCase().includes(q);
      const matchSt = statusTab === "all" || g.status === statusTab;
      return matchQ && matchSt;
    });
  }, [query, statusTab, initialData]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Support Requests</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Complaints and feedback raised across every institution</p>
      </div>

      <StatsRow grievances={initialData} />

      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
        {STATUS_TABS.map((t) => {
          const count = t.value === "all" ? initialData.length : initialData.filter((g) => g.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setStatusTab(t.value)} className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${statusTab===t.value?"text-primary-600 dark:text-primary-400":"text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${statusTab===t.value?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>{count}</span>
              {statusTab===t.value&&<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"/>}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by institution, subject…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20">
          <MessageSquareWarning className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No support requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => <GrievanceCard key={g.id} grievance={g} />)}
        </div>
      )}
    </div>
  );
}
