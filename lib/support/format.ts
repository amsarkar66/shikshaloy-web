import type { SupportRequestStatus } from "./types";

export const SUPPORT_STATUS_LABEL: Record<SupportRequestStatus, string> = {
  open: "Open",
  in_review: "In Review",
  resolved: "Resolved",
};

export const SUPPORT_STATUS_BADGE: Record<SupportRequestStatus, string> = {
  open: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  in_review: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  resolved: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

export const SUPPORT_CATEGORY_LABEL: Record<string, string> = {
  billing: "Billing & Subscription",
  technical: "Technical Issue",
  school_setup: "School Setup",
  other: "Other",
};

export function formatSupportDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatSupportDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
