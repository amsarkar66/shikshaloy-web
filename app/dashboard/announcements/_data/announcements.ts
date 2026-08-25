export type Priority = "urgent" | "normal" | "info";
export type Status   = "active" | "draft" | "archived";
export type Audience = "all" | "students" | "staff" | "parents" | "class";

export interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  normal: "Normal",
  info:   "Info",
};

export const PRIORITY_BADGE: Record<Priority, string> = {
  urgent: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
  normal: "bg-indigo-500/10 text-indigo-600  dark:text-indigo-400  border-indigo-500/20",
  info:   "bg-sky-500/10    text-sky-600     dark:text-sky-400     border-sky-500/20",
};

export const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-red-500",
  normal: "bg-indigo-400",
  info:   "bg-sky-400",
};

export const STATUS_LABEL: Record<Status, string> = {
  active:   "Active",
  draft:    "Draft",
  archived: "Archived",
};

export const STATUS_BADGE: Record<Status, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  draft:    "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  archived: "bg-gray-100       text-gray-500    dark:bg-zinc-800      dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

export const AUDIENCE_BADGE: Record<Audience, string> = {
  all:      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  students: "bg-blue-500/10   text-blue-600   dark:text-blue-400",
  staff:    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  parents:  "bg-rose-500/10   text-rose-600   dark:text-rose-400",
  class:    "bg-teal-500/10   text-teal-600   dark:text-teal-400",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
