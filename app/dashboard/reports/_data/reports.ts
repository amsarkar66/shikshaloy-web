export type ReportCategory = "academic" | "attendance" | "finance" | "student";
export type ReportFormat   = "pdf" | "excel" | "csv";

export interface Report {
  id:          number;
  name:        string;
  description: string;
  category:    ReportCategory;
  formats:     ReportFormat[];
  lastGenerated: string | null;
  isScheduled?:  boolean;
  scheduleLabel?: string;
}

export interface RecentReport {
  id:          string;
  reportId:    number;
  reportName:  string;
  category:    ReportCategory;
  format:      ReportFormat;
  generatedAt: string;
  generatedBy: string;
  sizeKb:      number;
}

/** Catalog of report types the school can generate — static feature config, not business data. */
export const REPORT_CATALOG: Omit<Report, "lastGenerated">[] = [
  // Academic
  { id: 1,  name: "Class-wise Performance Summary",   description: "Overall academic performance ranked by class and section, with pass rates and averages.", category: "academic", formats: ["pdf", "excel"], isScheduled: true, scheduleLabel: "Monthly" },
  { id: 2,  name: "Subject-wise Performance Analysis", description: "Detailed breakdown of student scores per subject across all sections.", category: "academic", formats: ["pdf", "excel", "csv"] },
  { id: 3,  name: "Toppers List",                      description: "Top 10 students per class ranked by aggregate percentage for the selected exam.", category: "academic", formats: ["pdf"] },
  { id: 4,  name: "Pass / Fail Analysis",               description: "Comparative pass and fail counts per subject, with improvement suggestions.", category: "academic", formats: ["pdf", "excel"] },
  { id: 5,  name: "Student Progress Report",            description: "Term-over-term improvement tracking for individual students.", category: "academic", formats: ["pdf"] },

  // Attendance
  { id: 6,  name: "Daily Attendance Summary",          description: "School-wide present / absent / leave count for a specific date.", category: "attendance", formats: ["pdf", "excel"], isScheduled: true, scheduleLabel: "Daily" },
  { id: 7,  name: "Monthly Attendance Report",         description: "Month-wise attendance percentage per student with bar chart visualisation.", category: "attendance", formats: ["pdf", "excel"], isScheduled: true, scheduleLabel: "Monthly" },
  { id: 8,  name: "Class-wise Attendance Summary",     description: "Attendance rates grouped by section for any date range.", category: "attendance", formats: ["pdf", "excel", "csv"] },
  { id: 9,  name: "Chronic Absenteeism Report",        description: "Students with attendance below 75% flagged for counselling.", category: "attendance", formats: ["pdf"] },
  { id: 10, name: "Staff Attendance Report",            description: "Staff present / absent / leave count with late-arrival flags.", category: "attendance", formats: ["pdf", "excel"] },

  // Finance
  { id: 11, name: "Fee Collection Summary",            description: "Total collected vs outstanding by class and payment method.", category: "finance", formats: ["pdf", "excel"], isScheduled: true, scheduleLabel: "Monthly" },
  { id: 12, name: "Outstanding Fees Report",            description: "Students with pending dues — includes parent contact details.", category: "finance", formats: ["pdf", "excel", "csv"] },
  { id: 13, name: "Expense Summary",                    description: "School expenses grouped by category with budget vs actual comparison.", category: "finance", formats: ["pdf", "excel"], isScheduled: true, scheduleLabel: "Monthly" },
  { id: 14, name: "Payroll Summary",                    description: "Staff salary disbursement breakdown including deductions and net pay.", category: "finance", formats: ["pdf", "excel"] },
  { id: 15, name: "Payment Receipt Log",                description: "Chronological log of all fee payments received in a date range.", category: "finance", formats: ["pdf", "csv"] },

  // Student
  { id: 16, name: "Student Strength Report",           description: "Enrolment count by class, section, and gender.", category: "student", formats: ["pdf", "excel"] },
  { id: 17, name: "New Admissions Report",              description: "Students admitted in the current academic year with profile summary.", category: "student", formats: ["pdf", "excel", "csv"] },
  { id: 18, name: "Transfer Certificate Report",        description: "List of students issued transfer certificates this academic year.", category: "student", formats: ["pdf"] },
  { id: 19, name: "Student Directory",                  description: "Complete student list with parent contacts, class, and fee status.", category: "student", formats: ["pdf", "excel", "csv"], isScheduled: true, scheduleLabel: "Weekly" },
  { id: 20, name: "Birthday List",                      description: "Upcoming student and staff birthdays for the selected month.", category: "student", formats: ["pdf"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDate(dateStr: string) {
  return new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatDateTime(dtStr: string) {
  const d = new Date(dtStr);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export const CATEGORY_META: Record<ReportCategory, { label: string; color: string; bg: string }> = {
  academic:   { label: "Academic",   color: "text-violet-600  dark:text-violet-400",  bg: "bg-violet-500/10"  },
  attendance: { label: "Attendance", color: "text-blue-600    dark:text-blue-400",    bg: "bg-blue-500/10"    },
  finance:    { label: "Finance",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  student:    { label: "Student",    color: "text-amber-600   dark:text-amber-400",   bg: "bg-amber-500/10"   },
};

export const FORMAT_META: Record<ReportFormat, { label: string; color: string }> = {
  pdf:   { label: "PDF",   color: "text-red-600    dark:text-red-400    bg-red-500/10"   },
  excel: { label: "Excel", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  csv:   { label: "CSV",   color: "text-blue-600   dark:text-blue-400   bg-blue-500/10"  },
};
