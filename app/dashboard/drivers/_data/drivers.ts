export type DriverStatus = "active" | "on_leave" | "inactive";

export interface Driver {
  id: string;            // profiles.id (auth user / login)
  staffId: string | null; // staff_members.id, if an HR record exists
  name: string;
  phone: string;
  email: string;
  employeeId: string;
  joinedDate: string;    // "YYYY-MM-DD"
  status: DriverStatus;
  assignedVehicle: string | null;   // reg no
  assignedRoutes: string[];         // route numbers
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

export function avatarColor(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export const STATUS_BADGE: Record<DriverStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive: "bg-gray-100       text-gray-500    dark:bg-zinc-800      dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

export const STATUS_LABEL: Record<DriverStatus, string> = {
  active: "Active", on_leave: "On Leave", inactive: "Inactive",
};

export function formatJoinDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
