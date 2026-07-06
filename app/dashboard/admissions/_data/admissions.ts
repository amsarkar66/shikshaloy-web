export type AdmissionStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "waitlisted"
  | "rejected"
  | "enrolled";

export const ACADEMIC_YEARS = ["2026-27", "2025-26"];
export const APPLY_CLASSES  = ["5", "6", "7", "8", "9", "10"];

// ── Display helpers ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<AdmissionStatus, string> = {
  pending:      "Pending",
  under_review: "Under Review",
  approved:     "Approved",
  waitlisted:   "Waitlisted",
  rejected:     "Rejected",
  enrolled:     "Enrolled",
};

export const STATUS_BADGE: Record<AdmissionStatus, string> = {
  pending:      "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  under_review: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",
  approved:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  waitlisted:   "bg-purple-500/10  text-purple-700  dark:text-purple-300  border-purple-500/20",
  rejected:     "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  enrolled:     "bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function calcAge(dob: string, academicYear: string) {
  const year = parseInt(academicYear.split("-")[0], 10);
  const born = new Date(dob);
  return year - born.getFullYear();
}
