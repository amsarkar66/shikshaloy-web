export type EventType    = "holiday" | "exam" | "meeting" | "sports" | "cultural" | "workshop" | "other";
export type AudienceType = "all" | "students" | "parents" | "staff" | "teachers";

export interface SchoolEvent {
  id:          number | string;
  title:       string;
  type:        EventType;
  date:        string;
  endDate?:    string;
  time?:       string;
  endTime?:    string;
  location?:   string;
  description: string;
  audience:    AudienceType[];
  isAllDay:    boolean;
  /** Set when this event represents a PTM session — lets the UI open the bookings view instead of a plain detail. */
  ptmSessionId?: string;
}

export const TYPE_LABEL: Record<EventType, string> = {
  holiday:  "Holiday",
  exam:     "Exam",
  meeting:  "Meeting",
  sports:   "Sports",
  cultural: "Cultural",
  workshop: "Workshop",
  other:    "Other",
};

export const TYPE_COLOR: Record<EventType, string> = {
  holiday:  "bg-red-500",
  exam:     "bg-violet-500",
  meeting:  "bg-blue-500",
  sports:   "bg-emerald-500",
  cultural: "bg-pink-500",
  workshop: "bg-amber-500",
  other:    "bg-zinc-400",
};

export const TYPE_BADGE: Record<EventType, string> = {
  holiday:  "bg-red-500/10    text-red-600    dark:text-red-400    border-red-500/20",
  exam:     "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  meeting:  "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",
  sports:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cultural: "bg-pink-500/10   text-pink-600   dark:text-pink-400   border-pink-500/20",
  workshop: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20",
  other:    "bg-zinc-500/10   text-zinc-600   dark:text-zinc-400   border-zinc-500/20",
};

export const AUDIENCE_LABEL: Record<AudienceType, string> = {
  all:      "All",
  students: "Students",
  parents:  "Parents",
  staff:    "Staff",
  teachers: "Teachers",
};

export const ALL_TYPES: EventType[] = ["holiday", "exam", "meeting", "sports", "cultural", "workshop", "other"];

export function getEventsForMonth(events: SchoolEvent[], year: number, month: number): SchoolEvent[] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  return events.filter((e) => {
    const eStart = e.date;
    const eEnd   = e.endDate ?? e.date;
    return eStart <= end && eEnd >= start;
  });
}

export function getUpcomingEvents(events: SchoolEvent[], fromDate: string, limit = 5): SchoolEvent[] {
  return events
    .filter((e) => (e.endDate ?? e.date) >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export const ACADEMIC_START = "2026-04";
export const ACADEMIC_END   = "2027-03";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getEventsForDate(events: SchoolEvent[], dateStr: string): SchoolEvent[] {
  return events.filter((e) => {
    const end = e.endDate ?? e.date;
    return dateStr >= e.date && dateStr <= end;
  });
}

/** Converts a 12-hour "3:00 PM" time string into 24-hour "15:00", as stored on SchoolEvent. */
function to24Hour(time: string): string {
  const [clock, meridiem] = time.split(" ");
  const [hRaw, mRaw] = clock.split(":").map(Number);
  let h = hRaw % 12;
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(mRaw).padStart(2, "0")}`;
}

/** Turns a scheduled PTM session into a calendar event so it shows up alongside other meetings. */
export function ptmSessionToEvent(session: {
  id: string; classNum: string; section: string; teacher: string; date: string;
  startTime: string; endTime: string; bookings: unknown[]; totalSlots: number;
}): SchoolEvent {
  return {
    id: `ptm-${session.id}`,
    title: `PTM — Class ${session.classNum}-${session.section}`,
    type: "meeting",
    date: session.date,
    time: to24Hour(session.startTime),
    endTime: to24Hour(session.endTime),
    location: "Respective Classrooms",
    description: `Parent-Teacher Meeting with ${session.teacher}. ${session.bookings.length}/${session.totalSlots} slots booked.`,
    audience: ["parents", "teachers"],
    isAllDay: false,
    ptmSessionId: session.id,
  };
}

export function countDays(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export function formatEventDateRange(event: SchoolEvent): string {
  if (!event.endDate || event.endDate === event.date) return formatDate(event.date);
  return `${formatDateShort(event.date)} – ${formatDate(event.endDate)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
