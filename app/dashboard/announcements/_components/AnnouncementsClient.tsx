"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone, Search, Plus, Download, X, Eye,
  Pencil, Archive, Send, AlertTriangle, Info,
  ChevronDown, ChevronUp, Users, GraduationCap,
  Briefcase, Heart, Globe, Clock, Loader2, RotateCcw, Trash2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  PRIORITY_LABEL, PRIORITY_BADGE, PRIORITY_DOT,
  STATUS_LABEL, STATUS_BADGE,
  AUDIENCE_BADGE,
  formatDate, daysUntil, stripHtml,
  type Priority, type Status, type Audience, type SectionOption,
} from "../_data/announcements";
import { toggleAnnouncementPublic, createAnnouncement, updateAnnouncement, setAnnouncementStatus, deleteAnnouncement } from "../actions";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  status: Status;
  audience: Audience;
  audienceLabel: string;
  targetSectionId?: string;
  date: string;
  expiresAt?: string;
  postedBy: string;
  views: number;
  isPublic: boolean;
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportCsv(announcements: Announcement[]) {
  const columns = ["Title", "Content", "Priority", "Status", "Audience", "Posted By", "Date", "Expires", "Views", "Public"];
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = announcements.map((a) => [
    a.title, stripHtml(a.content), PRIORITY_LABEL[a.priority], STATUS_LABEL[a.status],
    a.audienceLabel, a.postedBy, formatDate(a.date), a.expiresAt ? formatDate(a.expiresAt) : "",
    a.views, a.isPublic ? "Yes" : "No",
  ]);
  const csv = [columns, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `announcements-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow({ announcements }: { announcements: Announcement[] }) {
  const total  = announcements.length;
  const active = announcements.filter((a) => a.status === "active").length;
  const drafts = announcements.filter((a) => a.status === "draft").length;
  const urgent = announcements.filter((a) => a.priority === "urgent" && a.status === "active").length;
  const items = [
    { label: "Total",         value: total,  icon: Megaphone,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Active",        value: active, icon: Send,          accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Drafts",        value: drafts, icon: Clock,         accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Urgent Active", value: urgent, icon: AlertTriangle, accent: "text-red-500     bg-red-500/10"     },
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

function AudienceIcon({ audience }: { audience: Audience }) {
  const icons: Record<Audience, React.ElementType> = { all: Globe, students: GraduationCap, staff: Briefcase, parents: Heart, class: Users };
  const Icon = icons[audience];
  return <Icon className="h-3 w-3" />;
}

// ── Compose / Edit modal ─────────────────────────────────────────────────────

function AnnouncementModal({
  sections, existing, onClose, onSaved,
}: {
  sections: SectionOption[];
  existing: Announcement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? "normal");
  const [audience, setAudience] = useState<Audience>(existing?.audience ?? "all");
  const [targetSectionId, setTargetSectionId] = useState<string>(existing?.targetSectionId ?? sections[0]?.id ?? "");
  const [expiresAt, setExpiresAt] = useState<string | null>(existing?.expiresAt ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    stripHtml(content).length > 0 &&
    (audience !== "class" || !!targetSectionId) &&
    !busy;

  async function submit(status: "active" | "draft") {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const base = { title, content, priority, audience, expiresAt, targetSectionId: audience === "class" ? targetSectionId : null };
      if (existing) {
        await updateAnnouncement(existing.id, base);
      } else {
        await createAnnouncement({ ...base, status });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save announcement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{existing ? "Edit Announcement" : "New Announcement"}</p>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit(existing ? existing.status === "draft" ? "draft" : "active" : "active"); }} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Content</label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write the announcement body here…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Priority</label>
              <div className="flex gap-1.5">
                {(["normal", "info", "urgent"] as Priority[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)} className={`flex-1 h-8 rounded-lg border text-xs font-medium capitalize transition-colors ${priority===p?"bg-primary-500 border-primary-500 text-white":"border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"}`}>{PRIORITY_LABEL[p]}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Audience</label>
              <div className="relative">
                <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  <option value="all">Everyone</option><option value="students">All Students</option><option value="staff">All Staff</option><option value="parents">All Parents</option><option value="class">Specific Class</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
          {audience === "class" && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Class / Section</label>
              <div className="relative">
                <select value={targetSectionId} onChange={(e) => setTargetSectionId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" required>
                  {sections.length === 0 && <option value="">No sections available</option>}
                  {sections.map((s) => <option key={s.id} value={s.id}>Class {s.gradeLevel}-{s.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Expires (optional)</label>
            <DatePicker value={expiresAt ?? undefined} onChange={(v) => setExpiresAt(v)} placeholder="No expiry" />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {existing ? (
              <FancyButton type="submit" size="xs" disabled={!canSubmit}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save Changes
              </FancyButton>
            ) : (
              <>
                <FancyButton type="submit" size="xs" disabled={!canSubmit}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publish Now
                </FancyButton>
                <button type="button" onClick={() => submit("draft")} disabled={!canSubmit} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50">Save Draft</button>
              </>
            )}
            <button type="button" onClick={onClose} className="flex h-8 items-center px-3 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  announcement, onClose, onDeleted,
}: {
  announcement: Announcement;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteAnnouncement(announcement.id);
        onDeleted();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete announcement");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Delete announcement?</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This will permanently remove <span className="font-medium text-gray-700 dark:text-zinc-300">&ldquo;{announcement.title}&rdquo;</span>. This can&apos;t be undone.
          </p>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function AnnouncementCard({ ann, onEdit, onDelete }: { ann: Announcement; onEdit: (ann: Announcement) => void; onDelete: (ann: Announcement) => void }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [isPublic, setIsPublic] = useState(ann.isPublic);
  const [pending, startTransition] = useTransition();
  const [statusPending, startStatusTransition] = useTransition();
  const expires   = ann.expiresAt ? daysUntil(ann.expiresAt) : null;
  const isExpired = expires !== null && expires < 0;

  function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      try {
        await toggleAnnouncementPublic(ann.id, next);
      } catch {
        setIsPublic(!next);
      }
    });
  }

  function handleSetStatus(status: Status) {
    startStatusTransition(async () => {
      try {
        await setAnnouncementStatus(ann.id, status);
        router.refresh();
      } catch {
        // no-op — announcement keeps its current status if the update fails
      }
    });
  }

  return (
    <div className={`rounded-xl border bg-white dark:bg-zinc-800/50 overflow-hidden transition-shadow hover:shadow-sm ${ann.priority==="urgent"&&ann.status==="active"?"border-red-200 dark:border-red-900/50":"border-gray-200 dark:border-zinc-800"}`}>
      <div className={`h-0.5 w-full ${ann.priority==="urgent"?"bg-red-500":ann.priority==="info"?"bg-sky-400":"bg-indigo-400"}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg ${ann.priority==="urgent"?"bg-red-500/10 text-red-500":ann.priority==="info"?"bg-sky-500/10 text-sky-500":"bg-indigo-500/10 text-indigo-500"}`}>
            {ann.priority==="urgent"?<AlertTriangle className="h-4 w-4"/>:ann.priority==="info"?<Info className="h-4 w-4"/>:<Megaphone className="h-4 w-4"/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-sm font-semibold leading-tight text-gray-900 dark:text-zinc-100 ${ann.status==="archived"?"opacity-60":""}`}>{ann.title}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[ann.priority]}`}><span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[ann.priority]}`} />{PRIORITY_LABEL[ann.priority]}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[ann.status]}`}>{STATUS_LABEL[ann.status]}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${AUDIENCE_BADGE[ann.audience]}`}><AudienceIcon audience={ann.audience} />{ann.audienceLabel}</span>
              {ann.expiresAt&&ann.status==="active"&&<span className={`text-[10px] font-medium ${isExpired?"text-red-500 dark:text-red-400":expires!<=3?"text-amber-600 dark:text-amber-400":"text-gray-400 dark:text-zinc-500"}`}>{isExpired?"Expired":`Expires in ${expires} day${expires===1?"":"s"}`}</span>}
            </div>
          </div>
          {ann.status!=="draft"&&<div className="shrink-0 flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500"><Eye className="h-3.5 w-3.5" /><span>{ann.views.toLocaleString()}</span></div>}
        </div>
        <div className="pl-11">
          <div
            className={`text-sm text-gray-600 dark:text-zinc-400 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 dark:[&_blockquote]:border-zinc-600 [&_blockquote]:pl-3 [&_blockquote]:italic [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0 ${!expanded?"line-clamp-2":""}`}
            dangerouslySetInnerHTML={{ __html: ann.content }}
          />
          {stripHtml(ann.content).length>120&&<button onClick={()=>setExpanded(v=>!v)} className="mt-1 flex items-center gap-0.5 text-xs text-primary-600 dark:text-primary-400 hover:underline">{expanded?<><ChevronUp className="h-3 w-3"/>Show less</>:<><ChevronDown className="h-3 w-3"/>Read more</>}</button>}
        </div>
        <div className="pl-11 flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-zinc-500">
            <span>{formatDate(ann.date)}</span><span>·</span><span>by <span className="font-medium text-gray-500 dark:text-zinc-400">{ann.postedBy}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleTogglePublic}
              disabled={pending}
              title={isPublic ? "Visible on public website — click to unpublish" : "Not on public website — click to publish"}
              className={`flex h-7 items-center gap-1 px-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                isPublic
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200"
              }`}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              {isPublic ? "On website" : "Publish to website"}
            </button>
            <button onClick={() => onEdit(ann)} title="Edit" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            {ann.status==="draft"&&(
              <button onClick={() => handleSetStatus("active")} disabled={statusPending} title="Publish" className="flex h-7 items-center gap-1 px-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-xs font-medium disabled:opacity-50">
                {statusPending ? <Loader2 className="h-3 w-3 animate-spin"/> : <Send className="h-3 w-3"/>}Publish
              </button>
            )}
            {ann.status==="active"&&(
              <button onClick={() => handleSetStatus("archived")} disabled={statusPending} title="Archive" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50">
                {statusPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Archive className="h-3.5 w-3.5"/>}
              </button>
            )}
            {ann.status==="archived"&&(
              <button onClick={() => handleSetStatus("active")} disabled={statusPending} title="Restore" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50">
                {statusPending ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <RotateCcw className="h-3.5 w-3.5"/>}
              </button>
            )}
            {(ann.status==="draft"||ann.status==="archived")&&(
              <button onClick={() => onDelete(ann)} title="Delete" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS: { value: Status | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "draft",    label: "Drafts" },
  { value: "archived", label: "Archived" },
];

export default function AnnouncementsClient({ initialData, sections }: { initialData: Announcement[]; sections: SectionOption[] }) {
  const router = useRouter();
  const [query,          setQuery]    = useState("");
  const [statusTab,      setStatus]   = useState<Status | "all">("all");
  const [priorityFilter, setPriority] = useState<Priority | "all">("all");
  const [audienceFilter, setAudience] = useState<Audience | "all">("all");
  const [modalOpen,      setModalOpen] = useState(false);
  const [editing,        setEditing]  = useState<Announcement | null>(null);
  const [deleting,       setDeleting] = useState<Announcement | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialData.filter((a) => {
      const matchQ  = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.postedBy.toLowerCase().includes(q);
      const matchSt = statusTab      === "all" || a.status   === statusTab;
      const matchPr = priorityFilter === "all" || a.priority === priorityFilter;
      const matchAu = audienceFilter === "all" || a.audience === audienceFilter;
      return matchQ && matchSt && matchPr && matchAu;
    });
  }, [query, statusTab, priorityFilter, audienceFilter, initialData]);

  const hasFilter = query || statusTab !== "all" || priorityFilter !== "all" || audienceFilter !== "all";
  function clearFilters() { setQuery(""); setStatus("all"); setPriority("all"); setAudience("all"); }

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(ann: Announcement) { setEditing(ann); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(null); }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Announcements</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Broadcast updates</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => exportCsv(filtered)} disabled={filtered.length === 0} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"><Download className="h-3.5 w-3.5" /> Export</button>
          <FancyButton onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> New Announcement</FancyButton>
        </div>
      </div>

      <StatsRow announcements={initialData} />
      {modalOpen && (
        <AnnouncementModal
          sections={sections}
          existing={editing}
          onClose={closeModal}
          onSaved={() => router.refresh()}
        />
      )}
      {deleting && (
        <DeleteConfirmModal
          announcement={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => router.refresh()}
        />
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {STATUS_TABS.map((t) => {
          const count = t.value === "all" ? initialData.length : initialData.filter((a) => a.status === t.value).length;
          return (
            <button key={t.value} onClick={() => setStatus(t.value)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${statusTab===t.value?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
              {t.label}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusTab===t.value?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search announcements…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={priorityFilter} onChange={(e) => setPriority(e.target.value as Priority|"all")} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Priorities</option><option value="urgent">Urgent</option><option value="normal">Normal</option><option value="info">Info</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={audienceFilter} onChange={(e) => setAudience(e.target.value as Audience|"all")} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Audiences</option><option value="students">Students</option><option value="staff">Staff</option><option value="parents">Parents</option><option value="class">Specific Class</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20">
          <Megaphone className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No announcements found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ann) => <AnnouncementCard key={ann.id} ann={ann} onEdit={openEdit} onDelete={setDeleting} />)}
        </div>
      )}
    </div>
  );
}
