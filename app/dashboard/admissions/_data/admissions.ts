import {
  Clock, CheckCircle2, Ban, BookmarkCheck, RotateCcw, GraduationCap,
} from "lucide-react";

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

// ── Status transitions ──────────────────────────────────────────────────────
// Shared by the applications list (row menu) and the application detail page,
// so available actions per status can never drift out of sync between the two.

export type Transition = { label: string; status: AdmissionStatus; icon: React.ElementType; style: string; requiresReason?: boolean };

export const TRANSITIONS: Partial<Record<AdmissionStatus, Transition[]>> = {
  pending:      [{ label:"Mark Under Review",status:"under_review",icon:Clock,        style:"border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"},{ label:"Approve",status:"approved",icon:CheckCircle2,style:"border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"},{ label:"Reject",status:"rejected",icon:Ban,style:"border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",requiresReason:true}],
  under_review: [{ label:"Approve",status:"approved",icon:CheckCircle2,style:"border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"},{ label:"Waitlist",status:"waitlisted",icon:BookmarkCheck,style:"border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20",requiresReason:true},{ label:"Reject",status:"rejected",icon:Ban,style:"border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",requiresReason:true}],
  approved:     [{ label:"Enroll Student",status:"enrolled",icon:GraduationCap,style:"bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600"},{ label:"Reject",status:"rejected",icon:Ban,style:"border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",requiresReason:true}],
  waitlisted:   [{ label:"Approve",status:"approved",icon:CheckCircle2,style:"border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"},{ label:"Reject",status:"rejected",icon:Ban,style:"border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20",requiresReason:true}],
  rejected:     [{ label:"Reconsider",status:"pending",icon:RotateCcw,style:"border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"}],
};

export const MENU_ITEM_COLOR: Record<AdmissionStatus, string> = {
  pending:      "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10",
  under_review: "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10",
  approved:     "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
  waitlisted:   "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10",
  rejected:     "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10",
  enrolled:     "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
};
