"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquareWarning, Clock, Eye, CheckCircle2, Search,
  ChevronDown, ChevronUp, Mail, Phone, Loader2, Building2, LifeBuoy, MessageCircle,
} from "lucide-react";
import { updateGrievanceStatus, type GrievanceStatus } from "@/app/dashboard/grievances/actions";
import { SupportThreadModal } from "@/components/support/support-thread-modal";
import { updateSupportRequestStatus } from "@/lib/support/actions";
import type { SupportRequestSummary, SupportRequestStatus } from "@/lib/support/types";
import { SUPPORT_STATUS_LABEL, SUPPORT_STATUS_BADGE, SUPPORT_CATEGORY_LABEL, formatSupportDateTime } from "@/lib/support/format";

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

function GrievanceStatsRow({ grievances }: { grievances: PlatformGrievance[] }) {
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

const GRIEVANCE_STATUS_TABS: { value: GrievanceStatus | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "open",      label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved",  label: "Resolved" },
];

function GrievancesView({ initialData }: { initialData: PlatformGrievance[] }) {
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
    <div className="space-y-5">
      <GrievanceStatsRow grievances={initialData} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {GRIEVANCE_STATUS_TABS.map((t) => {
          const count = t.value === "all" ? initialData.length : initialData.filter((g) => g.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setStatusTab(t.value)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${statusTab===t.value?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
              {t.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTab===t.value?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>{count}</span>
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
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No grievances found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => <GrievanceCard key={g.id} grievance={g} />)}
        </div>
      )}
    </div>
  );
}

// ── Support requests (institution owners contacting Shikshaloy) ────────────

function SupportRequestStatsRow({ requests }: { requests: SupportRequestSummary[] }) {
  const total = requests.length;
  const open = requests.filter((r) => r.status === "open").length;
  const inReview = requests.filter((r) => r.status === "in_review").length;
  const resolved = requests.filter((r) => r.status === "resolved").length;
  const items = [
    { label: "Total",      value: total,    icon: LifeBuoy,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Open",       value: open,     icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
    { label: "In Review",  value: inReview, icon: Eye,          accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Resolved",   value: resolved, icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
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

const REQUEST_STATUS_TABS: { value: SupportRequestStatus | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "open",      label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved",  label: "Resolved" },
];

function SupportRequestsView({ requests, onOpen }: { requests: SupportRequestSummary[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<SupportRequestStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return requests.filter((r) => {
      const matchQ = !q || r.subject.toLowerCase().includes(q) || r.institutionName.toLowerCase().includes(q);
      const matchSt = statusTab === "all" || r.status === statusTab;
      return matchQ && matchSt;
    });
  }, [query, statusTab, requests]);

  return (
    <div className="space-y-5">
      <SupportRequestStatsRow requests={requests} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {REQUEST_STATUS_TABS.map((t) => {
          const count = t.value === "all" ? requests.length : requests.filter((r) => r.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setStatusTab(t.value)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${statusTab===t.value?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
              {t.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTab===t.value?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>{count}</span>
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
          <LifeBuoy className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No support requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.subject}</h3>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUPPORT_STATUS_BADGE[r.status]}`}>
                      {SUPPORT_STATUS_LABEL[r.status]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
                      {SUPPORT_CATEGORY_LABEL[r.category] ?? r.category}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">
                      <Building2 className="h-2.5 w-2.5" /> {r.institutionName}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">{formatSupportDateTime(r.updatedAt)}</p>
                  {r.lastMessagePreview && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">{r.lastMessagePreview}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                  <MessageCircle className="h-3.5 w-3.5" /> {r.messageCount}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportRequestStatusControl({ requestId, status }: { requestId: string; status: SupportRequestStatus }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSetStatus(next: SupportRequestStatus) {
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      try {
        await updateSupportRequestStatus(requestId, next);
        router.refresh();
      } catch {
        setCurrent(prev);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {(["open", "in_review", "resolved"] as SupportRequestStatus[]).map((s) => (
        <button
          key={s}
          onClick={() => handleSetStatus(s)}
          disabled={pending || current === s}
          className={`flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-60 ${
            current === s ? SUPPORT_STATUS_BADGE[s] : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
          }`}
        >
          {SUPPORT_STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type MainTab = "grievances" | "requests";

export default function SupportClient({
  initialData, initialSupportRequests,
}: {
  initialData: PlatformGrievance[];
  initialSupportRequests: SupportRequestSummary[];
}) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("requests");
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Support</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Requests from institution owners and grievances raised across every school</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {([
          { value: "requests", label: "Support Requests", icon: LifeBuoy, count: initialSupportRequests.length },
          { value: "grievances", label: "Grievances", icon: MessageSquareWarning, count: initialData.length },
        ] as const).map(({ value, label, icon: Icon, count }) => (
          <button
            key={value}
            onClick={() => setMainTab(value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              mainTab === value
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 px-1 text-[10px] font-semibold text-gray-500 dark:text-zinc-400">
              {count}
            </span>
          </button>
        ))}
      </div>

      {mainTab === "requests" ? (
        <SupportRequestsView requests={initialSupportRequests} onOpen={setOpenRequestId} />
      ) : (
        <GrievancesView initialData={initialData} />
      )}

      {openRequestId && (
        <SupportThreadModal
          requestId={openRequestId}
          viewerRole="kernel"
          onClose={() => setOpenRequestId(null)}
          onReplied={() => router.refresh()}
          headerExtra={(t) => (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">
                <Building2 className="h-2.5 w-2.5" /> {t.institutionName}
              </span>
              <SupportRequestStatusControl requestId={t.id} status={t.status} />
            </div>
          )}
        />
      )}
    </div>
  );
}
