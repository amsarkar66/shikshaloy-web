export type EventType    = "holiday" | "exam" | "meeting" | "sports" | "cultural" | "workshop" | "other";
export type AudienceType = "all" | "students" | "parents" | "staff" | "teachers";

export interface SchoolEvent {
  id:          number;
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

export function getEventsForMonth(year: number, month: number): SchoolEvent[] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  return ALL_EVENTS.filter((e) => {
    const eStart = e.date;
    const eEnd   = e.endDate ?? e.date;
    return eStart <= end && eEnd >= start;
  });
}

export function getUpcomingEvents(fromDate: string, limit = 5): SchoolEvent[] {
  return ALL_EVENTS
    .filter((e) => (e.endDate ?? e.date) >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export const ACADEMIC_START = "2026-04";
export const ACADEMIC_END   = "2027-03";

export const ALL_EVENTS: SchoolEvent[] = [
  // April 2026
  { id: 1,  title: "New Academic Year Begins",       type: "cultural",  date: "2026-04-01", isAllDay: true,  description: "Start of the 2026-27 academic year.",                                          audience: ["all"] },
  { id: 2,  title: "Good Friday",                    type: "holiday",   date: "2026-04-10", isAllDay: true,  description: "School holiday.",                                                               audience: ["all"] },
  { id: 3,  title: "Dr. Ambedkar Jayanti",           type: "holiday",   date: "2026-04-14", isAllDay: true,  description: "Public holiday.",                                                               audience: ["all"] },
  { id: 4,  title: "Parent Orientation Session",     type: "meeting",   date: "2026-04-25", isAllDay: false, time: "10:00", endTime: "12:00", location: "School Auditorium", description: "Welcome session for new parents joining 2026-27.", audience: ["parents"] },

  // May 2026
  { id: 5,  title: "Labour Day",                     type: "holiday",   date: "2026-05-01", isAllDay: true,  description: "Public holiday.",                                                               audience: ["all"] },
  { id: 6,  title: "Unit Test 1",                    type: "exam",      date: "2026-05-12", endDate: "2026-05-14", isAllDay: true, description: "First unit test for all classes (Mathematics, English, Science).", audience: ["students", "teachers"] },
  { id: 7,  title: "PTM – Unit Test 1 Results",      type: "meeting",   date: "2026-05-20", isAllDay: false, time: "09:00", endTime: "13:00", location: "Respective Classrooms", description: "Parent-Teacher Meeting to discuss Unit Test 1 results.", audience: ["parents", "teachers"] },
  { id: 8,  title: "Annual Sports Meet",             type: "sports",    date: "2026-05-28", isAllDay: true,  location: "School Ground", description: "Annual inter-house sports competition with track and field events.", audience: ["all"] },

  // June 2026
  { id: 9,  title: "World Environment Day",          type: "cultural",  date: "2026-06-05", isAllDay: true,  description: "Eco-awareness drive, tree plantation and assembly programme.",                   audience: ["all"] },
  { id: 10, title: "Mid-Year Academic Review",       type: "meeting",   date: "2026-06-15", isAllDay: false, time: "11:00", endTime: "13:00", location: "Conference Room", description: "Mid-year progress review with heads of departments.", audience: ["staff", "teachers"] },
  { id: 11, title: "Inter-School Cricket Tournament",type: "sports",    date: "2026-06-18", endDate: "2026-06-22", isAllDay: true, location: "School Ground", description: "Annual inter-school cricket tournament for Classes 8–10.", audience: ["students", "staff"] },
  { id: 12, title: "Staff Development Workshop",    type: "workshop",  date: "2026-06-22", isAllDay: false, time: "09:00", endTime: "17:00", location: "Staff Room", description: "Annual skill-development and pedagogy workshop for all teaching staff.", audience: ["staff", "teachers"] },
  { id: 13, title: "PTM – Grade 9 & 10",            type: "meeting",   date: "2026-06-23", isAllDay: false, time: "09:00", endTime: "13:00", location: "Respective Classrooms", description: "Parent-Teacher Meeting for Grades 9 and 10.", audience: ["parents", "teachers"] },
  { id: 14, title: "International Yoga Day",         type: "cultural",  date: "2026-06-27", isAllDay: false, time: "07:00", endTime: "09:00", location: "School Ground", description: "School-wide yoga session to mark International Yoga Day.", audience: ["all"] },

  // July 2026
  { id: 15, title: "Science Exhibition",             type: "cultural",  date: "2026-07-15", isAllDay: true,  location: "School Hall", description: "Annual science project exhibition open to all classes and visitors.", audience: ["all"] },
  { id: 16, title: "PTM – All Classes",              type: "meeting",   date: "2026-07-22", isAllDay: false, time: "09:00", endTime: "14:00", location: "Respective Classrooms", description: "General parent-teacher meeting for all classes.", audience: ["parents", "teachers"] },
  { id: 17, title: "Hindi Debate Competition",       type: "cultural",  date: "2026-07-30", isAllDay: false, time: "10:00", endTime: "13:00", location: "School Auditorium", description: "Inter-house Hindi debate competition for Classes 6–10.", audience: ["students", "teachers"] },

  // August 2026
  { id: 18, title: "Independence Day",               type: "holiday",   date: "2026-08-15", isAllDay: true,  description: "National holiday. Flag hoisting ceremony at 08:00 AM.",                         audience: ["all"] },
  { id: 19, title: "Unit Test 2",                    type: "exam",      date: "2026-08-18", endDate: "2026-08-20", isAllDay: true, description: "Second unit test for all classes.", audience: ["students", "teachers"] },

  // September 2026
  { id: 20, title: "Teacher's Day Celebration",     type: "cultural",  date: "2026-09-05", isAllDay: true,  location: "School Auditorium", description: "Special assembly and cultural programme by students on Teacher's Day.", audience: ["all"] },
  { id: 21, title: "Monthly Staff Meeting",          type: "meeting",   date: "2026-09-10", isAllDay: false, time: "14:00", endTime: "16:00", location: "Conference Room", description: "Monthly staff progress and planning meeting.", audience: ["staff", "teachers"] },
  { id: 22, title: "Mid-Term Examinations",          type: "exam",      date: "2026-09-15", endDate: "2026-09-24", isAllDay: true, description: "Mid-term examinations for all classes (5 subjects).", audience: ["students", "teachers"] },
  { id: 23, title: "Mid-Term Results & PTM",         type: "meeting",   date: "2026-09-28", isAllDay: false, time: "09:00", endTime: "12:00", location: "Respective Classrooms", description: "Distribution of mid-term result cards and parent-teacher discussion.", audience: ["parents", "students", "teachers"] },

  // October 2026
  { id: 24, title: "Gandhi Jayanti",                 type: "holiday",   date: "2026-10-02", isAllDay: true,  description: "Public holiday.",                                                               audience: ["all"] },
  { id: 25, title: "Navratri Break",                 type: "holiday",   date: "2026-10-12", endDate: "2026-10-15", isAllDay: true, description: "School holiday for Navratri festival.", audience: ["all"] },
  { id: 26, title: "Dussehra Holiday",               type: "holiday",   date: "2026-10-22", endDate: "2026-10-24", isAllDay: true, description: "School holiday for Dussehra.", audience: ["all"] },

  // November 2026
  { id: 27, title: "Children's Day",                 type: "cultural",  date: "2026-11-14", isAllDay: true,  location: "School Auditorium", description: "Celebration of Children's Day with cultural performances.", audience: ["students"] },
  { id: 28, title: "Annual Cultural Fest",           type: "cultural",  date: "2026-11-14", endDate: "2026-11-16", isAllDay: true, location: "School Auditorium", description: "Three-day annual inter-house cultural competition.", audience: ["all"] },
  { id: 29, title: "Unit Test 3",                    type: "exam",      date: "2026-11-17", endDate: "2026-11-19", isAllDay: true, description: "Third unit test for all classes.", audience: ["students", "teachers"] },

  // December 2026
  { id: 30, title: "Christmas Holiday",              type: "holiday",   date: "2026-12-25", isAllDay: true,  description: "Public holiday.",                                                               audience: ["all"] },
  { id: 31, title: "Winter Vacation",                type: "holiday",   date: "2026-12-26", endDate: "2027-01-04", isAllDay: true, description: "Annual winter vacation.", audience: ["all"] },

  // January 2027
  { id: 32, title: "School Reopens",                 type: "cultural",  date: "2027-01-05", isAllDay: true,  description: "School reopens after winter vacation.",                                          audience: ["all"] },
  { id: 33, title: "Republic Day",                   type: "holiday",   date: "2027-01-26", isAllDay: true,  description: "National holiday. Flag hoisting at 08:00 AM.",                                   audience: ["all"] },

  // February 2027
  { id: 34, title: "Annual Sports Day",              type: "sports",    date: "2027-02-10", isAllDay: true,  location: "School Ground", description: "Annual inter-house sports day featuring track and field, team sports, and athletics.", audience: ["all"] },
  { id: 35, title: "Science Fair",                   type: "cultural",  date: "2027-02-20", isAllDay: true,  location: "School Hall", description: "Open science fair for all grades, open to parents and visitors.", audience: ["all"] },
  { id: 36, title: "Pre-Final PTM",                  type: "meeting",   date: "2027-02-25", isAllDay: false, time: "09:00", endTime: "14:00", location: "Respective Classrooms", description: "Parent-Teacher Meeting before annual examinations.", audience: ["parents", "teachers"] },

  // March 2027
  { id: 37, title: "Annual Examination",             type: "exam",      date: "2027-03-03", endDate: "2027-03-13", isAllDay: true, description: "Final annual examinations for all classes.", audience: ["students", "teachers"] },
  { id: 38, title: "Results Distribution & PTM",    type: "meeting",   date: "2027-03-25", isAllDay: false, time: "09:00", endTime: "12:00", location: "Respective Classrooms", description: "Annual examination results distributed with parent-teacher discussion.", audience: ["parents", "students", "teachers"] },
  { id: 39, title: "Academic Year Closing Ceremony",type: "cultural",  date: "2027-03-31", isAllDay: true,  location: "School Auditorium", description: "Closing ceremony for the 2026-27 academic year with prize distribution.", audience: ["all"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getEventsForDate(dateStr: string): SchoolEvent[] {
  return ALL_EVENTS.filter((e) => {
    const end = e.endDate ?? e.date;
    return dateStr >= e.date && dateStr <= end;
  });
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
