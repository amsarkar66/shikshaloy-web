export type LeaveType   = "sick" | "casual" | "earned" | "maternity" | "emergency";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  sick:      "Sick Leave",
  casual:    "Casual Leave",
  earned:    "Earned Leave",
  maternity: "Maternity Leave",
  emergency: "Emergency Leave",
};

export const STATUS_BADGE: Record<LeaveStatus, { label: string; cls: string }> = {
  pending:   { label: "Pending",   cls: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20"   },
  approved:  { label: "Approved",  cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  rejected:  { label: "Rejected",  cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20"     },
  cancelled: { label: "Cancelled", cls: "bg-zinc-500/10    text-zinc-600    dark:text-zinc-400    border-zinc-500/20"    },
};

export const LEAVE_TYPE_BADGE: Record<LeaveType, string> = {
  sick:      "bg-red-500/10     text-red-700     dark:text-red-300",
  casual:    "bg-blue-500/10    text-blue-700    dark:text-blue-300",
  earned:    "bg-indigo-500/10  text-indigo-700  dark:text-indigo-300",
  maternity: "bg-pink-500/10    text-pink-700    dark:text-pink-300",
  emergency: "bg-orange-500/10  text-orange-700  dark:text-orange-300",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
