"use client";

import { useState, useMemo, useTransition, useRef, useLayoutEffect } from "react";
import {
  MessageSquareWarning, Clock, Eye, CheckCircle2,
  ChevronDown, ChevronUp, Mail, Phone, Loader2,
  StickyNote, X,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { updateGrievanceStatus, type GrievanceStatus } from "../actions";

export interface Grievance {
  id: string;
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

const STATUS_DOT: Record<GrievanceStatus, string> = {
  open: "bg-amber-500",
  in_review: "bg-blue-500",
  resolved: "bg-emerald-500",
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

function StatsRow({ grievances }: { grievances: Grievance[] }) {
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

function NoteModal({
  grievance, notes, status, onClose, onSaved,
}: {
  grievance: Grievance;
  notes: string;
  status: GrievanceStatus;
  onClose: () => void;
  onSaved: (notes: string) => void;
}) {
  const [value, setValue] = useState(notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateGrievanceStatus(grievance.id, status, value);
      onSaved(value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Resolution Note</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Resolution notes (optional)…"
            rows={4}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="button" onClick={handleSave} disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Note
            </FancyButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function GrievanceCard({ grievance }: { grievance: Grievance }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(grievance.status);
  const [notes, setNotes] = useState(grievance.resolutionNotes ?? "");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isClamped, setIsClamped] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = messageRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [grievance.message]);

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
              <Select value={status} onValueChange={(v) => handleSetStatus(v as GrievanceStatus)} disabled={pending}>
                <SelectTrigger className={`h-auto w-auto gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[status]}`}>
                  {pending ? <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" /> : STATUS_LABEL[status]}
                  <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-70" />
                </SelectTrigger>
                <SelectContent className="w-32">
                  {(["open", "in_review", "resolved"] as GrievanceStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[s]}`} />
                        {STATUS_LABEL[s]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
                {CATEGORY_LABEL[grievance.category] ?? grievance.category}
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

        <p ref={messageRef} className={`text-sm text-gray-600 dark:text-zinc-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
          {grievance.message}
        </p>
        {(isClamped || expanded) && (
          <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-0.5 text-xs text-primary-600 dark:text-primary-400 hover:underline">
            {expanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Read more</>}
          </button>
        )}

        <button
          onClick={() => setNoteModalOpen(true)}
          className="flex w-fit items-center gap-1.5 rounded-md bg-primary-50 dark:bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
        >
          <StickyNote className="h-3 w-3" /> {notes ? "Edit Note" : "Add Note"}
        </button>

        {notes && (
          <div className="flex items-start gap-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900/60 px-2.5 py-2 text-xs text-gray-500 dark:text-zinc-400">
            <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{notes}</span>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {noteModalOpen && (
        <NoteModal
          grievance={grievance}
          notes={notes}
          status={status}
          onClose={() => setNoteModalOpen(false)}
          onSaved={(next) => setNotes(next)}
        />
      )}
    </div>
  );
}

const STATUS_TABS: { value: GrievanceStatus | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "open",      label: "Open" },
  { value: "in_review", label: "In Review" },
  { value: "resolved",  label: "Resolved" },
];

export default function GrievancesClient({ initialData }: { initialData: Grievance[] }) {
  const [statusTab, setStatusTab] = useState<GrievanceStatus | "all">("all");

  const filtered = useMemo(() => {
    return initialData.filter((g) => statusTab === "all" || g.status === statusTab);
  }, [statusTab, initialData]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Grievances</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Track and resolve raised concerns</p>
        </div>
      </div>

      <StatsRow grievances={initialData} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {STATUS_TABS.map((t) => {
          const count = t.value === "all" ? initialData.length : initialData.filter((g) => g.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setStatusTab(t.value)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${statusTab===t.value?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
              {t.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTab===t.value?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>{count}</span>
            </button>
          );
        })}
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
