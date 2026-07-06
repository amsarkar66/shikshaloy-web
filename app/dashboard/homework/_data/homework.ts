export type HomeworkStatus = "active" | "closed";

export interface Homework {
  id: string;
  title: string;
  subject: string;
  sectionLabel: string;
  teacher: string;
  assignedDate: string; // ISO
  dueDate: string;      // ISO
  totalStudents: number;
  submitted: number;
  description: string;
  status: HomeworkStatus;
}

export function submissionRate(hw: Homework): number {
  return hw.totalStudents === 0 ? 0 : Math.round((hw.submitted / hw.totalStudents) * 100);
}

export function isOverdue(hw: Homework): boolean {
  return hw.status === "active" && new Date(hw.dueDate).getTime() < Date.now();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
