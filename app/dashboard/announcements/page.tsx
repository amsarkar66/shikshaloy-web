"use client";

import { useState, useMemo } from "react";
import {
  Megaphone, Search, Plus, Download, X, Eye,
  Pencil, Archive, Send, AlertTriangle, Info,
  ChevronDown, ChevronUp, Users, GraduationCap,
  Briefcase, Heart, Globe, Clock,
} from "lucide-react";
import {
  ALL_ANNOUNCEMENTS,
  PRIORITY_LABEL, PRIORITY_BADGE, PRIORITY_DOT,
  STATUS_LABEL,   STATUS_BADGE,
  AUDIENCE_BADGE,
  formatDate, daysUntil,
  type Priority, type Status, type Audience, type Announcement,
} from "./_data/announcements";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const total    = ALL_ANNOUNCEMENTS.length;
  const active   = ALL_ANNOUNCEMENTS.filter((a) => a.status === "active").length;
  const drafts   = ALL_ANNOUNCEMENTS.filter((a) => a.status === "draft").length;
  const urgent   = ALL_ANNOUNCEMENTS.filter((a) => a.priority === "urgent" && a.status === "active").length;

  const items = [
    { label: "Total",          value: total,  icon: Megaphone,      accent: "text-indigo-500  bg-indigo-500/10" },
    { label: "Active",         value: active, icon: Send,           accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Drafts",         value: drafts, icon: Clock,          accent: "text-amber-500   bg-amber-500/10" },
    { label: "Urgent Active",  value: urgent, icon: AlertTriangle,  accent: "text-red-500     bg-red-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4"
        >
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

// ── Audience icon ─────────────────────────────────────────────────────────────

function AudienceIcon({ audience }: { audience: Audience }) {
  const icons: Record<Audience, React.ElementType> = {
    all:      Globe,
    students: GraduationCap,
    staff:    Briefcase,
    parents:  Heart,
    class:    Users,
  };
  const Icon = icons[audience];
  return <Icon className="h-3 w-3" />;
}

// ── Compose panel ─────────────────────────────────────────────────────────────

function ComposePanel({ onClose }: { onClose: () => void }) {
  const [priority, setPriority] = useState<Priority>("normal");
  const [audience, setAudience] = useState<Audience>("all");

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">New Announcement</p>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Title</label>
          <input
            type="text"
            placeholder="Announcement title…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Content */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Content</label>
          <textarea
            rows={4}
            placeholder="Write the announcement body here…"
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Priority</label>
          <div className="flex gap-1.5">
            {(["normal", "info", "urgent"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 h-8 rounded-lg border text-xs font-medium capitalize transition-colors ${
                  priority === p
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">Everyone</option>
            <option value="students">All Students</option>
            <option value="staff">All Staff</option>
            <option value="parents">All Parents</option>
            <option value="class">Specific Class</option>
          </select>
        </div>

        {/* Expires */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">
            Expires On <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="date"
            className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-xs font-medium text-white transition-colors shadow-sm">
          <Send className="h-3.5 w-3.5" /> Publish Now
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          Save Draft
        </button>
        <button
          onClick={onClose}
          className="flex h-8 items-center px-3 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Announcement card ─────────────────────────────────────────────────────────

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const [expanded, setExpanded] = useState(false);

  const expires   = ann.expiresAt ? daysUntil(ann.expiresAt) : null;
  const isExpired = expires !== null && expires < 0;

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-zinc-800/50 overflow-hidden transition-shadow hover:shadow-sm ${
        ann.priority === "urgent" && ann.status === "active"
          ? "border-red-200 dark:border-red-900/50"
          : "border-gray-200 dark:border-zinc-800"
      }`}
    >
      {/* Priority stripe */}
      <div className={`h-0.5 w-full ${
        ann.priority === "urgent" ? "bg-red-500"
        : ann.priority === "info"   ? "bg-sky-400"
        : "bg-indigo-400"
      }`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg ${
            ann.priority === "urgent" ? "bg-red-500/10 text-red-500"
            : ann.priority === "info"   ? "bg-sky-500/10   text-sky-500"
            : "bg-indigo-500/10 text-indigo-500"
          }`}>
            {ann.priority === "urgent" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : ann.priority === "info" ? (
              <Info className="h-4 w-4" />
            ) : (
              <Megaphone className="h-4 w-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-sm font-semibold leading-tight text-gray-900 dark:text-zinc-100 ${
                ann.status === "archived" ? "opacity-60" : ""
              }`}>
                {ann.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Priority badge */}
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[ann.priority]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[ann.priority]}`} />
                {PRIORITY_LABEL[ann.priority]}
              </span>

              {/* Status badge */}
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[ann.status]}`}>
                {STATUS_LABEL[ann.status]}
              </span>

              {/* Audience badge */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${AUDIENCE_BADGE[ann.audience]}`}>
                <AudienceIcon audience={ann.audience} />
                {ann.audienceLabel}
              </span>

              {/* Expiry */}
              {ann.expiresAt && ann.status === "active" && (
                <span className={`text-[10px] font-medium ${
                  isExpired ? "text-red-500 dark:text-red-400"
                  : expires! <= 3 ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-400 dark:text-zinc-500"
                }`}>
                  {isExpired ? "Expired" : `Expires in ${expires} day${expires === 1 ? "" : "s"}`}
                </span>
              )}
            </div>
          </div>

          {/* View count (only for non-drafts) */}
          {ann.status !== "draft" && (
            <div className="shrink-0 flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
              <Eye className="h-3.5 w-3.5" />
              <span>{ann.views.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="pl-11">
          <p className={`text-sm text-gray-600 dark:text-zinc-400 leading-relaxed ${!expanded ? "line-clamp-2" : ""}`}>
            {ann.content}
          </p>
          {ann.content.length > 120 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Show less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Read more</>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pl-11 flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-zinc-500">
            <span>{formatDate(ann.date)}</span>
            <span>·</span>
            <span>by <span className="font-medium text-gray-500 dark:text-zinc-400">{ann.postedBy}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {ann.status === "draft" && (
              <button className="flex h-7 items-center gap-1 px-2 rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-xs font-medium">
                <Send className="h-3 w-3" /> Publish
              </button>
            )}
            {ann.status === "active" && (
              <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: Status | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "active",   label: "Active" },
  { value: "draft",    label: "Drafts" },
  { value: "archived", label: "Archived" },
];

export default function AnnouncementsPage() {
  const [query,          setQuery]    = useState("");
  const [statusTab,      setStatus]   = useState<Status | "all">("all");
  const [priorityFilter, setPriority] = useState<Priority | "all">("all");
  const [audienceFilter, setAudience] = useState<Audience | "all">("all");
  const [composing,      setCompose]  = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_ANNOUNCEMENTS.filter((a) => {
      const matchQ  = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.postedBy.toLowerCase().includes(q);
      const matchSt = statusTab      === "all" || a.status   === statusTab;
      const matchPr = priorityFilter === "all" || a.priority === priorityFilter;
      const matchAu = audienceFilter === "all" || a.audience === audienceFilter;
      return matchQ && matchSt && matchPr && matchAu;
    });
  }, [query, statusTab, priorityFilter, audienceFilter]);

  const hasFilter = query || statusTab !== "all" || priorityFilter !== "all" || audienceFilter !== "all";

  function clearFilters() {
    setQuery(""); setStatus("all"); setPriority("all"); setAudience("all");
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Announcements</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Broadcast updates to students, staff, and parents</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={() => setCompose((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </div>
      </div>

      <StatsRow />

      {/* Compose panel */}
      {composing && <ComposePanel onClose={() => setCompose(false)} />}

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
        {STATUS_TABS.map((t) => {
          const count = t.value === "all"
            ? ALL_ANNOUNCEMENTS.length
            : ALL_ANNOUNCEMENTS.filter((a) => a.status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                statusTab === t.value
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                statusTab === t.value
                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"
              }`}>
                {count}
              </span>
              {statusTab === t.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriority(e.target.value as Priority | "all")}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
          <option value="info">Info</option>
        </select>

        {/* Audience filter */}
        <select
          value={audienceFilter}
          onChange={(e) => setAudience(e.target.value as Audience | "all")}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Audiences</option>
          <option value="students">Students</option>
          <option value="staff">Staff</option>
          <option value="parents">Parents</option>
          <option value="class">Specific Class</option>
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

      {/* Result count */}
      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_ANNOUNCEMENTS.length}</span> announcements
        {hasFilter && <span className="ml-2 font-medium text-indigo-600 dark:text-indigo-400">· Filters active</span>}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20">
          <Megaphone className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No announcements found</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ann) => (
            <AnnouncementCard key={ann.id} ann={ann} />
          ))}
        </div>
      )}
    </div>
  );
}
