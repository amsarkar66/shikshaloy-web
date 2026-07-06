export type ExamType = "unit_test" | "mid_term" | "final";
export type ExamStatus = "upcoming" | "ongoing" | "completed" | "published";

export const MAX_MARKS = 100;
export const PASS_MARKS = 35;

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

export function getGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 35) return "D";
  return "F";
}

export function gradeStyle(grade: string): string {
  const map: Record<string, string> = {
    "A+": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "A":  "bg-green-500/10   text-green-600   dark:text-green-400   border-green-500/20",
    "B+": "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",
    "B":  "bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20",
    "C":  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
    "D":  "bg-orange-500/10  text-orange-600  dark:text-orange-400  border-orange-500/20",
    "F":  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  };
  return map[grade] ?? map["F"];
}

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
