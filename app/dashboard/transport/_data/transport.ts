export type RouteStatus = "active" | "inactive";
export type VehicleStatus = "active" | "maintenance" | "inactive";
export type TransportFeeStatus = "paid" | "partial" | "overdue";
export type FuelType = "diesel" | "cng" | "electric";

export interface Route {
  id: string;
  routeNo: string;
  routeName: string;
  driverId: string | null;
  driverPhone: string | null;
  stops: string[];
  studentCount: number;
  capacity: number;
  status: RouteStatus;
  morningDeparture: string | null;
  eveningDeparture: string | null;
}

export interface Vehicle {
  id: string;
  regNo: string;
  model: string;
  capacity: number;
  year: number;
  status: VehicleStatus;
  driverId: string | null;
  hasDriver: boolean;
  fuelType: FuelType;
  lastService: string | null;
  nextService: string | null;
}

export interface StudentTransport {
  id: string;
  studentName: string;
  rollNo: string;
  classNum: string;
  section: string;
  phone: string;
  routeNo: string;
  routeName: string;
  stopName: string;
  feeStatus: TransportFeeStatus;
  monthlyFee: number;
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

export function formatTime(t: string | null): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const FEE_BADGE: Record<TransportFeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

export const VEHICLE_STATUS_BADGE: Record<VehicleStatus, string> = {
  active:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  maintenance: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive:    "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

export const ROUTE_STATUS_BADGE: Record<RouteStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

export const FUEL_ICON: Record<FuelType, string> = {
  diesel: "⛽",
  cng: "🟢",
  electric: "⚡",
};
