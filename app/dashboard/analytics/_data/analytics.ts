export interface FeeMonth {
  month: string;
  collected: number; // in Lakhs
  due: number;        // in Lakhs
}

export interface ClassAttendance {
  label: string;
  value: number;
  students: number;
}

export interface SubjectPerf {
  subject: string;
  passRate: number;
  avg: number;
}

export interface GradeSlice {
  grade: string;
  pct: number;
  color: string;
}

export const GRADE_COLOR: Record<string, string> = {
  "A+": "#6366f1",
  "A":  "#22c55e",
  "B+": "#3b82f6",
  "B":  "#8b5cf6",
  "C":  "#f59e0b",
  "D":  "#f97316",
  "F":  "#ef4444",
};
