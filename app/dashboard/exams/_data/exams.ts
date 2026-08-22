export type ExamType = "unit_test" | "mid_term" | "final";
export type ExamStatus = "upcoming" | "ongoing" | "completed" | "published";

export const MAX_MARKS = 100;

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  status: ExamStatus;
  startDate: string;
  endDate: string;
  academicYear: string;
  subjects: string[];
}

export interface StudentExamResult {
  studentId: string;
  name: string;
  rollNo: string;
  sectionId: string;
  attendance: number;
  scores: number[];
  total: number;
  maxTotal: number;
  pct: number;
  grade: string;
  passed: boolean;
  rank: number;
}

export interface SectionExamStats {
  sectionId: string;
  teacher: string;
  enrolled: number;
  appeared: number;
  passed: number;
  passRate: number;
  avgScore: number;
  highest: number;
  lowest: number;
}

export const TYPE_LABEL: Record<ExamType, string> = {
  unit_test: "Unit Test",
  mid_term:  "Mid-Term",
  final:     "Final Exam",
};

export const TYPE_STYLE: Record<ExamType, string> = {
  unit_test: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20",
  mid_term:  "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",
  final:     "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
};

export const STATUS_LABEL: Record<ExamStatus, string> = {
  upcoming:  "Upcoming",
  ongoing:   "Ongoing",
  completed: "Completed",
  published: "Results Published",
};

export const STATUS_STYLE: Record<ExamStatus, string> = {
  upcoming:  "bg-zinc-100      dark:bg-zinc-800     text-zinc-600    dark:text-zinc-400   border-zinc-200 dark:border-zinc-700",
  ongoing:   "bg-sky-500/10    text-sky-600         dark:text-sky-400     border-sky-500/20",
  completed: "bg-emerald-500/10 text-emerald-600    dark:text-emerald-400 border-emerald-500/20",
  published: "bg-violet-500/10 text-violet-700      dark:text-violet-300  border-violet-500/20",
};

export function scoreColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 60) return "text-blue-600    dark:text-blue-400";
  if (pct >= 35) return "text-amber-600   dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });
}
