export type EventType = "holiday" | "exam" | "event" | "ptm" | "term" | "vacation";

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  dateTo?: string;
  type: EventType;
  description?: string;
  affectsAll: boolean;
  classes?: string;
};

export const MONTHS: string[] = [
  "April 2026", "May 2026", "June 2026", "July 2026", "August 2026",
  "September 2026", "October 2026", "November 2026", "December 2026",
  "January 2027", "February 2027", "March 2027",
];

export const MONTH_KEYS: string[] = [
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
  "2026-09", "2026-10", "2026-11", "2026-12",
  "2027-01", "2027-02", "2027-03",
];

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; cls: string; dot: string }> = {
  holiday:  { label: "Holiday",   cls: "bg-red-500/10    text-red-700    dark:text-red-300    border-red-500/20",    dot: "bg-red-500"    },
  exam:     { label: "Exam",      cls: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20", dot: "bg-violet-500" },
  event:    { label: "Event",     cls: "bg-blue-500/10   text-blue-700   dark:text-blue-300   border-blue-500/20",   dot: "bg-blue-500"   },
  ptm:      { label: "PTM",       cls: "bg-amber-500/10  text-amber-700  dark:text-amber-300  border-amber-500/20",  dot: "bg-amber-500"  },
  term:     { label: "Term",      cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", dot: "bg-emerald-500" },
  vacation: { label: "Vacation",  cls: "bg-sky-500/10    text-sky-700    dark:text-sky-300    border-sky-500/20",    dot: "bg-sky-500"    },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
