"use client";

import { useState, useMemo, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquareWarning, Clock, Eye, CheckCircle2, Search,
  ChevronDown, ChevronUp, Mail, Phone, Loader2, Building2, LifeBuoy, MessageCircle, Inbox, Star,
  ArrowLeft, CornerUpLeft, MoreVertical, Printer, Download, Trash2, MailOpen,
} from "lucide-react";
import { updateGrievanceStatus, type GrievanceStatus } from "@/app/dashboard/grievances/actions";
import { SupportThreadModal } from "@/components/support/support-thread-modal";
import { updateSupportRequestStatus } from "@/lib/support/actions";
import type { SupportRequestSummary, SupportRequestStatus } from "@/lib/support/types";
import { SUPPORT_STATUS_LABEL, SUPPORT_STATUS_BADGE, SUPPORT_CATEGORY_LABEL, formatSupportDateTime } from "@/lib/support/format";
import { replyToContactLead, toggleContactLeadFlag, markContactLeadNotReplied, deleteContactLead, markContactLeadViewed, markContactLeadUnread } from "../actions";

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  repliedAt: string | null;
  flagged: boolean;
  viewedAt: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

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

// ── Leads (public marketing-site contact form) ──────────────────────────────

const LEAD_TOPIC_LABEL: Record<string, string> = {
  sales: "Sales inquiry",
  support: "Technical support",
  demo: "Request a demo",
  other: "Something else",
};

const LEAD_TOPIC_DOT: Record<string, string> = {
  sales: "bg-amber-500",
  support: "bg-blue-500",
  demo: "bg-emerald-500",
  other: "bg-gray-400",
};

function LeadStatsRow({ leads }: { leads: ContactLead[] }) {
  const total = leads.length;
  const flagged = leads.filter((l) => l.flagged).length;
  const sales = leads.filter((l) => l.topic === "sales").length;
  const support = leads.filter((l) => l.topic === "support").length;
  const demo = leads.filter((l) => l.topic === "demo").length;
  const items = [
    { label: "Total",    value: total,    icon: Inbox,         accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Flagged",  value: flagged,  icon: Star,          accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Sales",    value: sales,    icon: LifeBuoy,      accent: "text-orange-500  bg-orange-500/10"  },
    { label: "Support",  value: support,  icon: MessageCircle, accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Demo",     value: demo,     icon: CheckCircle2,  accent: "text-emerald-500 bg-emerald-500/10" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

function LeadRow({ lead, onOpen }: { lead: ContactLead; onOpen: (id: string) => void }) {
  const [flagged, setFlagged] = useState(lead.flagged);
  const [flagPending, startFlagTransition] = useTransition();
  const unread = !lead.viewedAt;

  function handleToggleFlag(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !flagged;
    setFlagged(next);
    startFlagTransition(async () => {
      try {
        await toggleContactLeadFlag(lead.id, next);
      } catch {
        setFlagged(!next);
      }
    });
  }

  return (
    <div
      onClick={() => onOpen(lead.id)}
      className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors last:border-b-0"
    >
      <button
        onClick={handleToggleFlag}
        disabled={flagPending}
        aria-label={flagged ? "Unflag lead" : "Flag lead as important"}
        className="shrink-0 text-gray-300 dark:text-zinc-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
      >
        <Star className={`h-4 w-4 ${flagged ? "fill-amber-400 text-amber-400" : ""}`} />
      </button>

      <span className={`h-3 w-0.5 shrink-0 rounded-full ${LEAD_TOPIC_DOT[lead.topic] ?? "bg-gray-400"}`} title={LEAD_TOPIC_LABEL[lead.topic] ?? lead.topic} />

      <span className={`w-36 shrink-0 truncate text-sm ${unread ? "font-bold text-gray-900 dark:text-zinc-50" : "font-medium text-gray-500 dark:text-zinc-400"}`}>{lead.name}</span>

      <span className="min-w-0 flex-1 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${unread ? "bg-primary-500" : "bg-transparent"}`} title={unread ? "Unread" : undefined} />
        <span className={`min-w-0 truncate text-sm ${unread ? "text-gray-700 dark:text-zinc-300" : "text-gray-400 dark:text-zinc-500"}`}>{lead.message}</span>
      </span>

      {lead.repliedAt && (
        <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-2.5 w-2.5" /> Replied
        </span>
      )}

      <span className={`shrink-0 text-xs w-16 text-right ${unread ? "font-semibold text-gray-700 dark:text-zinc-300" : "text-gray-400 dark:text-zinc-500"}`}>{formatDate(lead.createdAt)}</span>
    </div>
  );
}

function LeadDetail({ lead, onBack, onChanged }: { lead: ContactLead; onBack: () => void; onChanged: () => void }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [repliedAt, setRepliedAt] = useState(lead.repliedAt);
  const [flagged, setFlagged] = useState(lead.flagged);
  const [sendPending, startSendTransition] = useTransition();
  const [flagPending, startFlagTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [markPending, startMarkTransition] = useTransition();
  const [viewedAt, setViewedAt] = useState(lead.viewedAt);
  const [unreadPending, startUnreadTransition] = useTransition();

  useEffect(() => {
    if (lead.viewedAt) return;
    let cancelled = false;
    markContactLeadViewed(lead.id)
      .then(() => {
        if (!cancelled) {
          setViewedAt(new Date().toISOString());
          onChanged();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleMarkUnread() {
    const prev = viewedAt;
    setViewedAt(null);
    startUnreadTransition(async () => {
      try {
        await markContactLeadUnread(lead.id);
        onChanged();
      } catch {
        setViewedAt(prev);
      }
    });
  }

  function handleMarkNotReplied() {
    const prev = repliedAt;
    setRepliedAt(null);
    startMarkTransition(async () => {
      try {
        await markContactLeadNotReplied(lead.id);
        onChanged();
      } catch {
        setRepliedAt(prev);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete the lead from ${lead.name}? This can't be undone.`)) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      try {
        await deleteContactLead(lead.id);
        onChanged();
        onBack();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete lead");
      }
    });
  }

  function handleToggleMenu() {
    if (!menuOpen && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  }

  function handlePrint() {
    setMenuOpen(false);
    window.print();
  }

  function handleDownload() {
    setMenuOpen(false);
    const subject = `${LEAD_TOPIC_LABEL[lead.topic] ?? lead.topic} — ${lead.name}`;
    const content = [
      `From: ${lead.name} <${lead.email}>`,
      `To: Shikshaloy <support@shikshaloy.com>`,
      `Subject: ${subject}`,
      `Date: ${new Date(lead.createdAt).toUTCString()}`,
      "",
      lead.message,
    ].join("\r\n");
    const blob = new Blob([content], { type: "message/rfc822" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-${lead.id}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleSend() {
    const message = reply.trim();
    if (!message) return;
    setError(null);
    startSendTransition(async () => {
      try {
        await replyToContactLead({ leadId: lead.id, message });
        setRepliedAt(new Date().toISOString());
        setReply("");
        setReplying(false);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      }
    });
  }

  function handleToggleFlag() {
    const next = !flagged;
    setFlagged(next);
    startFlagTransition(async () => {
      try {
        await toggleContactLeadFlag(lead.id, next);
        onChanged();
      } catch {
        setFlagged(!next);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <button
          onClick={onBack}
          aria-label="Back to leads"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-gray-100 dark:bg-zinc-800" />

        {repliedAt && (
          <button
            onClick={handleMarkNotReplied}
            disabled={markPending}
            title="Mark as not replied"
            aria-label="Mark as not replied"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
          </button>
        )}
        {viewedAt && (
          <button
            onClick={handleMarkUnread}
            disabled={unreadPending}
            title="Mark as unread"
            aria-label="Mark as unread"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <MailOpen className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deletePending}
          title="Delete lead"
          aria-label="Delete lead"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {repliedAt && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5" /> Replied
          </span>
        )}
      </div>

      {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}

      <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50">
        {LEAD_TOPIC_LABEL[lead.topic] ?? lead.topic} — {lead.name}
      </h2>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
              {lead.name} <span className="font-normal text-gray-400 dark:text-zinc-500">&lt;{lead.email}&gt;</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">to Shikshaloy</p>
            {(lead.utmSource || lead.utmCampaign) && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                via {[lead.utmSource, lead.utmMedium].filter(Boolean).join("/") || "unknown"}
                {lead.utmCampaign && <> — {lead.utmCampaign}</>}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <span className="mr-1 text-xs text-gray-400 dark:text-zinc-500">{formatDate(lead.createdAt)}</span>
            <button
              onClick={handleToggleFlag}
              disabled={flagPending}
              aria-label={flagged ? "Unflag lead" : "Flag lead as important"}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-amber-400 transition-colors disabled:opacity-50"
            >
              <Star className={`h-4 w-4 ${flagged ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
            <button
              onClick={() => setReplying(true)}
              aria-label="Reply"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <CornerUpLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                ref={menuBtnRef}
                onClick={handleToggleMenu}
                aria-label="More actions"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && menuPos && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div
                    style={{ top: menuPos.top, right: menuPos.right }}
                    className="fixed z-20 w-48 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
                  >
                    <button
                      onClick={() => { setMenuOpen(false); setReplying(true); }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <CornerUpLeft className="h-4 w-4 shrink-0" /> Reply
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <Printer className="h-4 w-4 shrink-0" /> Print
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      <Download className="h-4 w-4 shrink-0" /> Download (.eml)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
        </div>
      </div>

      {!replying ? (
        <button
          onClick={() => setReplying(true)}
          className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <CornerUpLeft className="h-4 w-4" /> {repliedAt ? "Reply again" : "Reply"}
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 space-y-2.5">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Reply to ${lead.name}…`}
            rows={5}
            autoFocus
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSend}
              disabled={sendPending || !reply.trim()}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {sendPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send reply
            </button>
            <button
              onClick={() => { setReplying(false); setReply(""); setError(null); }}
              disabled={sendPending}
              className="flex h-8 items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const LEAD_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "demo", label: "Demo" },
  { value: "other", label: "Other" },
  { value: "flagged", label: "Flagged" },
];

const LEAD_SIDEBAR_FOLDERS: { value: string; label: string; icon: typeof Inbox }[] = [
  { value: "all", label: "Inbox", icon: Inbox },
  { value: "unread", label: "Unread", icon: Mail },
  { value: "not_replied", label: "Not Replied", icon: Clock },
  { value: "replied", label: "Replied", icon: CheckCircle2 },
  { value: "flagged", label: "Flagged", icon: Star },
];

const LEAD_SIDEBAR_TOPICS = ["sales", "support", "demo", "other"];

function leadMatchesFilter(lead: ContactLead, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !lead.viewedAt;
  if (filter === "flagged") return lead.flagged;
  if (filter === "replied") return !!lead.repliedAt;
  if (filter === "not_replied") return !lead.repliedAt;
  return lead.topic === filter;
}

function LeadsSidebar({ leads, filter, onFilter }: { leads: ContactLead[]; filter: string; onFilter: (v: string) => void }) {
  return (
    <aside className="w-full lg:w-52 shrink-0 space-y-4">
      <nav className="space-y-0.5">
        {LEAD_SIDEBAR_FOLDERS.map((f) => {
          const count = leads.filter((l) => leadMatchesFilter(l, f.value)).length;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => onFilter(f.value)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400"
                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              <f.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">{f.label}</span>
              <span className={`text-xs ${active ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-zinc-500"}`}>{count}</span>
            </button>
          );
        })}
      </nav>

      <div>
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">Topics</p>
        <nav className="mt-1 space-y-0.5">
          {LEAD_SIDEBAR_TOPICS.map((t) => {
            const count = leads.filter((l) => l.topic === t).length;
            const active = filter === t;
            return (
              <button
                key={t}
                onClick={() => onFilter(t)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span className={`h-2.5 w-0.5 shrink-0 rounded-full ${LEAD_TOPIC_DOT[t] ?? "bg-gray-400"}`} />
                <span className="flex-1 text-left truncate">{LEAD_TOPIC_LABEL[t] ?? t}</span>
                <span className={`text-xs ${active ? "text-primary-600 dark:text-primary-400" : "text-gray-400 dark:text-zinc-500"}`}>{count}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function LeadsView({ leads }: { leads: ContactLead[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.message.toLowerCase().includes(q);
      return matchQ && leadMatchesFilter(l, filter);
    });
  }, [query, filter, leads]);

  const openLead = openLeadId ? leads.find((l) => l.id === openLeadId) ?? null : null;

  return (
    <div className="space-y-5">
      <LeadStatsRow leads={leads} />

      <div className="flex flex-col lg:flex-row gap-5">
        <LeadsSidebar leads={leads} filter={filter} onFilter={setFilter} />

        <div className="min-w-0 flex-1 space-y-4">
          {openLead ? (
            <LeadDetail
              lead={openLead}
              onBack={() => setOpenLeadId(null)}
              onChanged={() => router.refresh()}
            />
          ) : (
          <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {LEAD_FILTERS.map((f) => {
                const count = f.value === "all" ? leads.length : leads.filter((l) => leadMatchesFilter(l, f.value)).length;
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {f.label}
                    <span className={active ? "opacity-70" : "text-gray-400 dark:text-zinc-500"}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20">
              <Inbox className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No leads found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              {filtered.map((l) => <LeadRow key={l.id} lead={l} onOpen={setOpenLeadId} />)}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type MainTab = "grievances" | "requests" | "leads";

export default function SupportClient({
  initialData, initialSupportRequests, initialContactLeads,
}: {
  initialData: PlatformGrievance[];
  initialSupportRequests: SupportRequestSummary[];
  initialContactLeads: ContactLead[];
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
          { value: "leads", label: "Leads", icon: Inbox, count: initialContactLeads.length },
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
      ) : mainTab === "grievances" ? (
        <GrievancesView initialData={initialData} />
      ) : (
        <LeadsView leads={initialContactLeads} />
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
