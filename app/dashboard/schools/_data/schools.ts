export type SchoolStatus = "active" | "inactive" | "pending";

export interface School {
  id: string;
  name: string;
  institutionType: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website: string | null;
  address: string | null;
  status: SchoolStatus;
  principalName: string | null;
  principalEmail: string | null;
  establishedYear: number | null;
  students: number;
  staff: number;
  admins: number;
  attendancePct: number;
  feePct: number;
  monthlyRevenue: number;
}

export const STATUS_BADGE: Record<SchoolStatus, { cls: string; label: string }> = {
  active:   { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Active"   },
  inactive: { cls: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700", label: "Inactive" },
  pending:  { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Pending"  },
};

export function formatLakh(n: number): string {
  return `₹${(n / 100000).toFixed(1)}L`;
}
