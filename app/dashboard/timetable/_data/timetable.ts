export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface Period {
  num:   number;
  start: string;
  end:   string;
}

export const PERIODS: Period[] = [
  { num: 1, start: "8:00",  end: "8:45"  },
  { num: 2, start: "8:45",  end: "9:30"  },
  { num: 3, start: "9:45",  end: "10:30" },
  { num: 4, start: "10:30", end: "11:15" },
  { num: 5, start: "12:00", end: "12:45" },
  { num: 6, start: "12:45", end: "1:30"  },
  { num: 7, start: "1:30",  end: "2:15"  },
  { num: 8, start: "2:15",  end: "3:00"  },
];

export type RowItem =
  | { type: "period"; period: Period }
  | { type: "break";  label: string; time: string };

export const ROW_ITEMS: RowItem[] = [
  { type: "period", period: PERIODS[0] },
  { type: "period", period: PERIODS[1] },
  { type: "break",  label: "Short Break", time: "9:30 – 9:45"   },
  { type: "period", period: PERIODS[2] },
  { type: "period", period: PERIODS[3] },
  { type: "break",  label: "Lunch Break", time: "11:15 – 12:00" },
  { type: "period", period: PERIODS[4] },
  { type: "period", period: PERIODS[5] },
  { type: "period", period: PERIODS[6] },
  { type: "period", period: PERIODS[7] },
];

export interface Slot {
  subject: string;
  name:    string;
  teacher: string;
  room:    string;
}

export type DaySchedule     = Partial<Record<number, Slot>>;
export type ClassTimetable  = Record<Day, DaySchedule>;

// Per-subject accent colour (left border + bg + text)
export const SUBJECT_STYLE: Record<string, { border: string; bg: string; text: string }> = {
  MATH: { border: "border-blue-500",    bg: "bg-blue-50    dark:bg-blue-500/10",    text: "text-blue-700    dark:text-blue-300"    },
  ENG:  { border: "border-indigo-500",  bg: "bg-indigo-50  dark:bg-indigo-500/10",  text: "text-indigo-700  dark:text-indigo-300"  },
  SCI:  { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300" },
  PHY:  { border: "border-cyan-500",    bg: "bg-cyan-50    dark:bg-cyan-500/10",    text: "text-cyan-700    dark:text-cyan-300"    },
  CHE:  { border: "border-violet-500",  bg: "bg-violet-50  dark:bg-violet-500/10",  text: "text-violet-700  dark:text-violet-300"  },
  BIO:  { border: "border-green-600",   bg: "bg-green-50   dark:bg-green-500/10",   text: "text-green-700   dark:text-green-300"   },
  SST:  { border: "border-amber-500",   bg: "bg-amber-50   dark:bg-amber-500/10",   text: "text-amber-700   dark:text-amber-300"   },
  HIS:  { border: "border-orange-500",  bg: "bg-orange-50  dark:bg-orange-500/10",  text: "text-orange-700  dark:text-orange-300"  },
  GEO:  { border: "border-yellow-500",  bg: "bg-yellow-50  dark:bg-yellow-500/10",  text: "text-yellow-700  dark:text-yellow-300"  },
  HIN:  { border: "border-rose-500",    bg: "bg-rose-50    dark:bg-rose-500/10",    text: "text-rose-700    dark:text-rose-300"    },
  CS:   { border: "border-slate-500",   bg: "bg-slate-50   dark:bg-slate-500/10",   text: "text-slate-700   dark:text-slate-300"   },
  PE:   { border: "border-teal-500",    bg: "bg-teal-50    dark:bg-teal-500/10",    text: "text-teal-700    dark:text-teal-300"    },
  ART:  { border: "border-pink-500",    bg: "bg-pink-50    dark:bg-pink-500/10",    text: "text-pink-700    dark:text-pink-300"    },
  MUS:  { border: "border-purple-500",  bg: "bg-purple-50  dark:bg-purple-500/10",  text: "text-purple-700  dark:text-purple-300"  },
  DAN:  { border: "border-fuchsia-500", bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  EVS:  { border: "border-lime-600",    bg: "bg-lime-50    dark:bg-lime-500/10",    text: "text-lime-700    dark:text-lime-300"    },
  ECO:  { border: "border-amber-600",   bg: "bg-amber-50   dark:bg-amber-500/10",   text: "text-amber-800   dark:text-amber-300"   },
  FRE:  { border: "border-sky-500",     bg: "bg-sky-50     dark:bg-sky-500/10",     text: "text-sky-700     dark:text-sky-300"     },
};
export const DEFAULT_STYLE = { border: "border-gray-400", bg: "bg-gray-50 dark:bg-zinc-700/40", text: "text-gray-700 dark:text-zinc-300" };

export const CLASS_LIST = [
  "5-A", "5-B", "6-A", "6-B", "7-A", "7-B",
  "8-A", "8-B", "9-A", "9-B", "10-A", "10-B",
];

// ── Slot helpers ─────────────────────────────────────────────────────────────

function s(subject: string, name: string, teacher: string, room: string): Slot {
  return { subject, name, teacher, room };
}

const M  = (r = "R-101") => s("MATH", "Mathematics",           "Ramesh Kumar",    r);
const E  = (r = "R-101") => s("ENG",  "English",               "Priya Sharma",    r);
const SC = (r = "R-101") => s("SCI",  "Science",               "Anil Verma",      r);
const SS = (r = "R-101") => s("SST",  "Social Studies",        "Deepak Singh",    r);
const H  = (r = "R-101") => s("HIN",  "Hindi",                 "Seema Joshi",     r);
const EV = (r = "R-101") => s("EVS",  "Env. Science",          "Pooja Tiwari",    r);
const PE = ()             => s("PE",   "Physical Education",    "Arjun Patil",     "Ground");
const AR = ()             => s("ART",  "Art & Craft",           "Meena Das",       "Art Room");
const MU = ()             => s("MUS",  "Music",                 "Ravi Shankar",    "Music Room");
const DN = ()             => s("DAN",  "Dance",                 "Ananya Pillai",   "Hall");
const PH = (r = "R-201") => s("PHY",  "Physics",               "Sunita Rao",      r);
const CH = (r = "R-201") => s("CHE",  "Chemistry",             "Mohan Iyer",      r);
const BI = (r = "R-201") => s("BIO",  "Biology",               "Kavita Nair",     r);
const HI = (r = "R-201") => s("HIS",  "History & Civics",      "Neha Gupta",      r);
const GE = (r = "R-201") => s("GEO",  "Geography",             "Vijay Mehta",     r);
const CS = ()             => s("CS",   "Computer Science",      "Rajiv Bose",      "Comp. Lab");
const EC = (r = "R-201") => s("ECO",  "Economics",             "Harish Reddy",    r);
const FR = (r = "R-201") => s("FRE",  "French",                "Sanjay Roy",      r);

// Build ClassTimetable from a [6-day][8-period] grid (null = free period)
function build(grid: (Slot | null)[][]): ClassTimetable {
  const result = {} as ClassTimetable;
  DAYS.forEach((day, di) => {
    result[day] = {};
    PERIODS.forEach((p, pi) => {
      const slot = grid[di]?.[pi] ?? null;
      if (slot) result[day][p.num] = slot;
    });
  });
  return result;
}

// ── Timetable data ────────────────────────────────────────────────────────────

export const TIMETABLES: Record<string, ClassTimetable> = {
  "5-A": build([
    /* Mon */ [M("R-101"), E("R-101"),  SC("R-101"), SS("R-101"), H("R-101"),  EV("R-101"), AR(),      PE()      ],
    /* Tue */ [E("R-101"), M("R-101"),  H("R-101"),  SC("R-101"), SS("R-101"), MU(),        EV("R-101"),PE()     ],
    /* Wed */ [H("R-101"), SC("R-101"), M("R-101"),  EV("R-101"), E("R-101"),  SS("R-101"), MU(),      DN()      ],
    /* Thu */ [SC("R-101"),H("R-101"),  EV("R-101"), M("R-101"),  E("R-101"),  AR(),        SS("R-101"),MU()     ],
    /* Fri */ [M("R-101"), E("R-101"),  SS("R-101"), H("R-101"),  SC("R-101"), M("R-101"),  DN(),      null      ],
    /* Sat */ [SC("R-101"),M("R-101"),  E("R-101"),  EV("R-101"), H("R-101"),  PE(),        null,      null      ],
  ]),

  "5-B": build([
    /* Mon */ [E("R-102"), M("R-102"),  H("R-102"),  SC("R-102"), EV("R-102"), SS("R-102"), MU(),      PE()      ],
    /* Tue */ [M("R-102"), SC("R-102"), E("R-102"),  H("R-102"),  SS("R-102"), EV("R-102"), AR(),      DN()      ],
    /* Wed */ [SC("R-102"),E("R-102"),  SS("R-102"), M("R-102"),  H("R-102"),  MU(),        PE(),      EV("R-102")],
    /* Thu */ [H("R-102"), SS("R-102"), M("R-102"),  E("R-102"),  SC("R-102"), AR(),        EV("R-102"),M("R-102")],
    /* Fri */ [SS("R-102"),H("R-102"),  SC("R-102"), EV("R-102"), M("R-102"),  E("R-102"),  null,      null      ],
    /* Sat */ [M("R-102"), E("R-102"),  DN(),        H("R-102"),  SC("R-102"), PE(),        null,      null      ],
  ]),

  "6-A": build([
    /* Mon */ [M("R-103"), E("R-103"),  SC("R-103"), SS("R-103"), H("R-103"),  EV("R-103"), AR(),      PE()      ],
    /* Tue */ [SC("R-103"),M("R-103"),  EV("R-103"), E("R-103"),  SS("R-103"), H("R-103"),  MU(),      PE()      ],
    /* Wed */ [E("R-103"), H("R-103"),  M("R-103"),  SC("R-103"), EV("R-103"), MU(),        SS("R-103"),AR()     ],
    /* Thu */ [H("R-103"), SC("R-103"), SS("R-103"), M("R-103"),  E("R-103"),  EV("R-103"), AR(),      MU()      ],
    /* Fri */ [M("R-103"), SS("R-103"), H("R-103"),  EV("R-103"), SC("R-103"), E("R-103"),  null,      null      ],
    /* Sat */ [E("R-103"), M("R-103"),  SC("R-103"), H("R-103"),  SS("R-103"), PE(),        null,      null      ],
  ]),

  "9-A": build([
    /* Mon */ [M("R-201"), PH("Lab-1"), E("R-201"),  CH("Lab-2"), HI("R-201"), H("R-201"),  CS(),      PE()      ],
    /* Tue */ [PH("Lab-1"),M("R-201"),  CH("Lab-2"), E("R-201"),  BI("Lab-3"), GE("R-201"), H("R-201"),CS()      ],
    /* Wed */ [E("R-201"), CH("Lab-2"), M("R-201"),  BI("Lab-3"), H("R-201"),  PH("Lab-1"), HI("R-201"),GE("R-201")],
    /* Thu */ [CH("Lab-2"),E("R-201"),  BI("Lab-3"), M("R-201"),  GE("R-201"), CS(),        PH("Lab-1"),H("R-201")],
    /* Fri */ [BI("Lab-3"),M("R-201"),  H("R-201"),  E("R-201"),  CS(),        HI("R-201"), GE("R-201"),null     ],
    /* Sat */ [M("R-201"), BI("Lab-3"), PH("Lab-1"), CH("Lab-2"), PE(),        E("R-201"),  null,      null      ],
  ]),

  "10-A": build([
    /* Mon */ [M("R-202"), PH("Lab-1"), E("R-202"),  CH("Lab-2"), HI("R-202"), H("R-202"),  CS(),      PE()      ],
    /* Tue */ [PH("Lab-1"),M("R-202"),  CH("Lab-2"), E("R-202"),  BI("Lab-3"), GE("R-202"), FR("R-202"),EC("R-202")],
    /* Wed */ [E("R-202"), CH("Lab-2"), M("R-202"),  BI("Lab-3"), H("R-202"),  PH("Lab-1"), HI("R-202"),GE("R-202")],
    /* Thu */ [CH("Lab-2"),E("R-202"),  PH("Lab-1"), M("R-202"),  GE("R-202"), CS(),        BI("Lab-3"),H("R-202")],
    /* Fri */ [BI("Lab-3"),M("R-202"),  H("R-202"),  E("R-202"),  CS(),        HI("R-202"), EC("R-202"),null     ],
    /* Sat */ [M("R-202"), BI("Lab-3"), FR("R-202"), CH("Lab-2"), PE(),        E("R-202"),  null,      null      ],
  ]),
};

// ── Derived helpers ───────────────────────────────────────────────────────────

export function computeStats(tt: ClassTimetable) {
  const slots: Slot[] = [];
  DAYS.forEach((d) => PERIODS.forEach((p) => { const s = tt[d]?.[p.num]; if (s) slots.push(s); }));
  const total    = DAYS.length * PERIODS.length;
  const scheduled = slots.length;
  const subjects  = new Set(slots.map((s) => s.subject)).size;
  const teachers  = new Set(slots.map((s) => s.teacher)).size;
  return { scheduled, free: total - scheduled, subjects, teachers };
}

// In teacher view the `teacher` field is repurposed to carry the class label
// so SlotCell shows "Class 5-A" instead of the teacher's own name.
export function getTeacherSchedule(teacher: string): ClassTimetable {
  const result = {} as ClassTimetable;
  DAYS.forEach((d) => { result[d] = {}; });
  for (const [classId, tt] of Object.entries(TIMETABLES)) {
    DAYS.forEach((d) => {
      PERIODS.forEach((p) => {
        const slot = tt[d]?.[p.num];
        if (slot?.teacher === teacher) {
          result[d][p.num] = { ...slot, teacher: `Class ${classId}`, room: slot.room };
        }
      });
    });
  }
  return result;
}

export function getAllTeachers(): string[] {
  const set = new Set<string>();
  for (const tt of Object.values(TIMETABLES))
    DAYS.forEach((d) => PERIODS.forEach((p) => { const sl = tt[d]?.[p.num]; if (sl) set.add(sl.teacher); }));
  return Array.from(set).sort();
}

export interface TeacherSummary {
  teacher:  string;
  subjects: string[];
  classes:  string[];
  periods:  number;
}

export function getTeacherSummaries(): TeacherSummary[] {
  const map = new Map<string, { subjects: Set<string>; classes: Set<string>; periods: number }>();
  for (const [classId, tt] of Object.entries(TIMETABLES)) {
    DAYS.forEach((d) => PERIODS.forEach((p) => {
      const sl = tt[d]?.[p.num];
      if (!sl) return;
      if (!map.has(sl.teacher)) map.set(sl.teacher, { subjects: new Set(), classes: new Set(), periods: 0 });
      const e = map.get(sl.teacher)!;
      e.subjects.add(sl.name);
      e.classes.add(classId);
      e.periods++;
    }));
  }
  return Array.from(map.entries())
    .map(([teacher, { subjects, classes, periods }]) => ({
      teacher,
      subjects: Array.from(subjects).sort(),
      classes:  Array.from(classes).sort(),
      periods,
    }))
    .sort((a, b) => a.teacher.localeCompare(b.teacher));
}
