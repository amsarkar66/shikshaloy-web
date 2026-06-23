import { ALL_STUDENTS, type Student } from "../../students/_data/students";
import { ALL_SECTIONS, type ClassSection } from "../../classes/_data/classes";

export type ExamType   = "unit_test" | "mid_term" | "final";
export type ExamStatus = "upcoming" | "ongoing" | "completed" | "published";

export interface Exam {
  id:           number;
  name:         string;
  type:         ExamType;
  status:       ExamStatus;
  startDate:    string;
  endDate:      string;
  academicYear: string;
}

// Subjects tested per exam type
export const EXAM_SUBJECTS: Record<ExamType, string[]> = {
  unit_test: ["Mathematics", "English", "Science"],
  mid_term:  ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
  final:     ["English", "Hindi", "Mathematics", "Science", "Social Studies"],
};

export const MAX_MARKS  = 100;
export const PASS_MARKS = 35;

export const ALL_EXAMS: Exam[] = [
  // ── 2026-27 ──────────────────────────────────────────────────────────────────
  { id: 1,  name: "Unit Test 1",          type: "unit_test", status: "published", startDate: "2026-05-12", endDate: "2026-05-14", academicYear: "2026-27" },
  { id: 2,  name: "Unit Test 2",          type: "unit_test", status: "upcoming",  startDate: "2026-08-18", endDate: "2026-08-20", academicYear: "2026-27" },
  { id: 3,  name: "Mid-Term Examination", type: "mid_term",  status: "upcoming",  startDate: "2026-09-15", endDate: "2026-09-24", academicYear: "2026-27" },
  { id: 4,  name: "Unit Test 3",          type: "unit_test", status: "upcoming",  startDate: "2026-11-17", endDate: "2026-11-19", academicYear: "2026-27" },
  { id: 5,  name: "Annual Examination",   type: "final",     status: "upcoming",  startDate: "2027-03-03", endDate: "2027-03-13", academicYear: "2026-27" },
  // ── 2025-26 ──────────────────────────────────────────────────────────────────
  { id: 6,  name: "Unit Test 1",          type: "unit_test", status: "published", startDate: "2025-05-14", endDate: "2025-05-16", academicYear: "2025-26" },
  { id: 7,  name: "Unit Test 2",          type: "unit_test", status: "published", startDate: "2025-08-19", endDate: "2025-08-21", academicYear: "2025-26" },
  { id: 8,  name: "Mid-Term Examination", type: "mid_term",  status: "published", startDate: "2025-09-16", endDate: "2025-09-25", academicYear: "2025-26" },
  { id: 9,  name: "Unit Test 3",          type: "unit_test", status: "published", startDate: "2025-11-18", endDate: "2025-11-20", academicYear: "2025-26" },
  { id: 10, name: "Annual Examination",   type: "final",     status: "published", startDate: "2026-03-04", endDate: "2026-03-14", academicYear: "2025-26" },
];

export const ACADEMIC_YEARS = ["2026-27", "2025-26"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
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

// ── Per-student results ───────────────────────────────────────────────────────

function studentSubjectScore(student: Student, examId: number, subjectIdx: number): number {
  const seed  = student.id * 97 + examId * 53 + subjectIdx * 31;
  const base  = (student.attendance - 60) * 0.9 + 42; // ~25–62 for attendance 68–99
  const delta = (lcg(seed) - 0.5) * 50;               // ±25
  return Math.max(0, Math.min(100, Math.round(base + delta)));
}

export interface StudentExamResult {
  student:  Student;
  scores:   number[];
  total:    number;
  maxTotal: number;
  pct:      number;
  grade:    string;
  passed:   boolean;
  rank:     number;
}

export function getSectionStudentResults(sectionId: string, exam: Exam): StudentExamResult[] {
  const [cls, sec] = sectionId.split("-");
  const students   = ALL_STUDENTS.filter((s) => s.class === cls && s.section === sec);
  const subjects   = EXAM_SUBJECTS[exam.type];
  const maxTotal   = subjects.length * MAX_MARKS;

  const results: StudentExamResult[] = students.map((st) => {
    const scores = subjects.map((_, i) => studentSubjectScore(st, exam.id, i));
    const total  = scores.reduce((a, b) => a + b, 0);
    const pct    = Math.round((total / maxTotal) * 100);
    return {
      student: st, scores, total, maxTotal, pct,
      grade:   getGrade(pct),
      passed:  scores.every((s) => s >= PASS_MARKS),
      rank:    0,
    };
  });

  results.sort((a, b) => b.pct - a.pct);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

// ── Section aggregate (for all enrolled students) ─────────────────────────────

export interface SectionExamStats {
  section:  ClassSection;
  appeared: number;
  passed:   number;
  passRate: number;
  avgScore: number;
  highest:  number;
  lowest:   number;
}

export function getSectionExamStats(section: ClassSection, exam: Exam): SectionExamStats {
  const seed    = section.id.charCodeAt(0) * 41 + section.id.charCodeAt(2) * 17 + exam.id * 23;
  const absent  = Math.min(5, Math.round(section.enrolled * 0.03 + lcg(seed) * 2));
  const appeared = section.enrolled - absent;
  const basePR  = Math.max(55, Math.min(100, section.avgAttendance - 5 + (lcg(seed + 1) - 0.5) * 10));
  const passRate = Math.round(basePR);
  const passed   = Math.round(appeared * passRate / 100);
  const avgScore = Math.round(section.avgAttendance * 0.55 + 22 + (lcg(seed + 2) - 0.5) * 8);
  const highest  = Math.min(100, avgScore + Math.round(lcg(seed + 3) * 12 + 10));
  const lowest   = Math.max(15, avgScore - Math.round(lcg(seed + 4) * 15 + 12));
  return { section, appeared, passed, passRate, avgScore, highest, lowest };
}

export function getExamSchoolStats(exam: Exam) {
  const stats         = ALL_SECTIONS.map((s) => getSectionExamStats(s, exam));
  const totalAppeared = stats.reduce((a, s) => a + s.appeared, 0);
  const totalPassed   = stats.reduce((a, s) => a + s.passed, 0);
  const avgScore      = Math.round(stats.reduce((a, s) => a + s.avgScore, 0) / stats.length);
  const passRate      = Math.round((totalPassed / totalAppeared) * 100);
  return { totalAppeared, totalPassed, avgScore, passRate };
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

export { ALL_SECTIONS };
