export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface Period {
  num: number;
  start: string;
  end: string;
}

export type RowItem =
  | { type: "period"; period: Period }
  | { type: "break"; label: string; time: string };

export interface Slot {
  subject: string;
  name: string;
  teacher: string;
  room: string;
}

export type DaySchedule = Partial<Record<number, Slot>>;
export type ClassTimetable = Record<Day, DaySchedule>;

const SUBJECT_COLORS = [
  { border: "border-blue-500",    bg: "bg-blue-50    dark:bg-blue-500/10",    text: "text-blue-700    dark:text-blue-300"    },
  { border: "border-indigo-500",  bg: "bg-indigo-50  dark:bg-indigo-500/10",  text: "text-indigo-700  dark:text-indigo-300"  },
  { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300" },
  { border: "border-cyan-500",    bg: "bg-cyan-50    dark:bg-cyan-500/10",    text: "text-cyan-700    dark:text-cyan-300"    },
  { border: "border-violet-500",  bg: "bg-violet-50  dark:bg-violet-500/10",  text: "text-violet-700  dark:text-violet-300"  },
  { border: "border-amber-500",   bg: "bg-amber-50   dark:bg-amber-500/10",   text: "text-amber-700   dark:text-amber-300"   },
  { border: "border-rose-500",    bg: "bg-rose-50    dark:bg-rose-500/10",    text: "text-rose-700    dark:text-rose-300"    },
  { border: "border-teal-500",    bg: "bg-teal-50    dark:bg-teal-500/10",    text: "text-teal-700    dark:text-teal-300"    },
];
export const DEFAULT_STYLE = { border: "border-gray-400", bg: "bg-gray-50 dark:bg-zinc-700/40", text: "text-gray-700 dark:text-zinc-300" };

export function subjectStyle(subjectCode: string) {
  const n = subjectCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return SUBJECT_COLORS[n % SUBJECT_COLORS.length];
}

export function computeStats(tt: ClassTimetable, periods: Period[]) {
  const slots: Slot[] = [];
  DAYS.forEach((d) => periods.forEach((p) => { const s = tt[d]?.[p.num]; if (s) slots.push(s); }));
  const total = DAYS.length * periods.length;
  const scheduled = slots.length;
  const subjects = new Set(slots.map((s) => s.subject)).size;
  const teachers = new Set(slots.map((s) => s.teacher)).size;
  return { scheduled, free: total - scheduled, subjects, teachers };
}

export function getTeacherSchedule(timetables: Record<string, ClassTimetable>, teacher: string): ClassTimetable {
  const result = {} as ClassTimetable;
  DAYS.forEach((d) => { result[d] = {}; });
  for (const [classId, tt] of Object.entries(timetables)) {
    DAYS.forEach((d) => {
      Object.entries(tt[d] ?? {}).forEach(([numStr, slot]) => {
        if (slot?.teacher === teacher) {
          result[d][Number(numStr)] = { ...slot, teacher: `Class ${classId}`, room: slot.room };
        }
      });
    });
  }
  return result;
}

export interface TeacherSummary {
  teacher: string;
  subjects: string[];
  classes: string[];
  periods: number;
}

export function getTeacherSummaries(timetables: Record<string, ClassTimetable>): TeacherSummary[] {
  const map = new Map<string, { subjects: Set<string>; classes: Set<string>; periods: number }>();
  for (const [classId, tt] of Object.entries(timetables)) {
    DAYS.forEach((d) => Object.values(tt[d] ?? {}).forEach((sl) => {
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
      classes: Array.from(classes).sort(),
      periods,
    }))
    .sort((a, b) => a.teacher.localeCompare(b.teacher));
}
