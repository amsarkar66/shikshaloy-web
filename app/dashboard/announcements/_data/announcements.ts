export type Priority = "urgent" | "normal" | "info";
export type Status   = "active" | "draft" | "archived";
export type Audience = "all" | "students" | "staff" | "parents" | "class";

export interface Announcement {
  id:            number;
  title:         string;
  content:       string;
  priority:      Priority;
  status:        Status;
  audience:      Audience;
  audienceLabel: string;
  date:          string;
  expiresAt?:    string;
  postedBy:      string;
  views:         number;
}

export const ALL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: "Annual Sports Day — June 28, 2026",
    content:
      "We are delighted to announce that our Annual Sports Day will be held on Saturday, June 28, 2026 on the school grounds. All students are required to report by 8:00 AM in their respective house colours. Parents and guardians are warmly invited to attend and cheer.",
    priority: "normal",
    status: "active",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-06-20",
    expiresAt: "2026-06-28",
    postedBy: "Principal",
    views: 312,
  },
  {
    id: 2,
    title: "URGENT: School Closed Tomorrow Due to Heavy Rainfall",
    content:
      "Due to the weather warning issued by the district authority, the school will remain closed tomorrow, June 24, 2026. Online classes will not be conducted. Stay safe and remain indoors. School will resume on June 25 as normal.",
    priority: "urgent",
    status: "active",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-06-23",
    postedBy: "Principal",
    views: 891,
  },
  {
    id: 3,
    title: "Half-Yearly Exam Schedule Released",
    content:
      "The half-yearly examination schedule for Classes 1–12 has been published. Exams will be conducted from July 7 to July 18, 2026. Students are advised to download the timetable from the Exams section. No changes will be made to the schedule.",
    priority: "normal",
    status: "active",
    audience: "students",
    audienceLabel: "All Students",
    date: "2026-06-18",
    expiresAt: "2026-07-07",
    postedBy: "Vice Principal",
    views: 543,
  },
  {
    id: 4,
    title: "Staff Meeting — June 25, 2026 at 3:30 PM",
    content:
      "All teaching and non-teaching staff are requested to attend a mandatory staff meeting on June 25, 2026 at 3:30 PM in the Conference Hall. Agenda includes the upcoming exam schedule, new attendance policy, and parent-teacher meet planning. Kindly make arrangements for class supervision.",
    priority: "urgent",
    status: "active",
    audience: "staff",
    audienceLabel: "All Staff",
    date: "2026-06-22",
    expiresAt: "2026-06-25",
    postedBy: "Principal",
    views: 84,
  },
  {
    id: 5,
    title: "Parent-Teacher Meeting — July 3, 2026",
    content:
      "The quarterly Parent-Teacher Meeting is scheduled for July 3, 2026 between 10:00 AM and 1:00 PM. Parents of students in Classes 5–10 are requested to attend. Slot booking will open on June 28 via the school portal. Please bring your ward's recent progress report.",
    priority: "normal",
    status: "active",
    audience: "parents",
    audienceLabel: "All Parents",
    date: "2026-06-19",
    expiresAt: "2026-07-03",
    postedBy: "Admin Office",
    views: 228,
  },
  {
    id: 6,
    title: "New Library Catalogue Available Online",
    content:
      "The updated library catalogue for the 2026–27 session is now available on the school portal. Students can browse and reserve books online before visiting the library. The library will also remain open during lunch break on Tuesdays and Thursdays.",
    priority: "info",
    status: "active",
    audience: "students",
    audienceLabel: "All Students",
    date: "2026-06-15",
    postedBy: "Librarian",
    views: 167,
  },
  {
    id: 7,
    title: "Fee Payment Reminder — June Dues Pending",
    content:
      "This is a gentle reminder that June 2026 fee dues are still outstanding for a number of students. Please ensure payment is made before June 30 to avoid a late fee. Parents may pay online via the portal or visit the school accounts office between 9:00 AM and 2:00 PM on working days.",
    priority: "urgent",
    status: "active",
    audience: "parents",
    audienceLabel: "All Parents",
    date: "2026-06-21",
    expiresAt: "2026-06-30",
    postedBy: "Accounts Dept.",
    views: 189,
  },
  {
    id: 8,
    title: "Congratulations — Science Olympiad Winners",
    content:
      "We are proud to announce that our students Rohit Verma (Class 9A), Ananya Singh (Class 10B), and Priya Kulkarni (Class 8A) have secured 1st, 2nd, and 3rd place respectively in the State Science Olympiad 2026. A felicitation ceremony will be held on June 27 during assembly.",
    priority: "info",
    status: "active",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-06-17",
    postedBy: "Principal",
    views: 402,
  },
  {
    id: 9,
    title: "Class 10 Board Preparation — Extra Classes Starting July",
    content:
      "Extra coaching classes for Class 10 students will begin from July 1, 2026, on Saturdays and Sundays from 9:00 AM to 12:00 PM. Subjects covered: Mathematics, Science, Social Studies, and English. Attendance is compulsory. Students must register with the class teacher by June 27.",
    priority: "normal",
    status: "draft",
    audience: "class",
    audienceLabel: "Class 10",
    date: "2026-06-23",
    postedBy: "Vice Principal",
    views: 0,
  },
  {
    id: 10,
    title: "Independence Day Celebrations — August 15",
    content:
      "All students and staff are requested to be present at school on August 15, 2026 for Independence Day celebrations. The programme will commence at 8:00 AM with the flag hoisting ceremony. Cultural performances will follow. Attendance is mandatory.",
    priority: "normal",
    status: "draft",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-06-23",
    postedBy: "Admin Office",
    views: 0,
  },
  {
    id: 11,
    title: "Summer Vacation Notice 2026",
    content:
      "Summer vacation was observed from May 1 to June 2, 2026. School resumed on June 3, 2026. We hope everyone had a refreshing break.",
    priority: "info",
    status: "archived",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-04-28",
    expiresAt: "2026-06-03",
    postedBy: "Admin Office",
    views: 774,
  },
  {
    id: 12,
    title: "Annual Day 2026 — Thank You",
    content:
      "We extend our heartfelt thanks to everyone who made Annual Day 2026 a grand success. Special thanks to all students, parents, and staff who participated and contributed.",
    priority: "info",
    status: "archived",
    audience: "all",
    audienceLabel: "Everyone",
    date: "2026-03-15",
    postedBy: "Principal",
    views: 621,
  },
];

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

export const AUDIENCE_LABEL: Record<Audience, string> = {
  all:      "Everyone",
  students: "Students",
  staff:    "Staff",
  parents:  "Parents",
  class:    "Specific Class",
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
