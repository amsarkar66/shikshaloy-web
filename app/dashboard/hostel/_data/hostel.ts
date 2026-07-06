export type RoomType = "single" | "double" | "triple" | "dormitory";
export type RoomStatus = "available" | "occupied" | "maintenance";
export type FeeStatus = "paid" | "partial" | "overdue";

export interface HostelRoom {
  id: string;
  roomNo: string;
  block: string;
  floor: number;
  type: RoomType;
  capacity: number;
  occupied: number;
  warden: string;
  amenities: string[];
  status: RoomStatus;
}

export interface HostelStudent {
  id: string;
  studentName: string;
  rollNo: string;
  classNum: string;
  section: string;
  roomNo: string;
  block: string;
  joinDate: string;
  monthlyFee: number;
  feeStatus: FeeStatus;
  phone: string;
  parentName: string;
}

export const ROOM_STATUS_BADGE: Record<RoomStatus, string> = {
  available:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  occupied:    "bg-blue-500/10    text-blue-600     dark:text-blue-400    border-blue-500/20",
  maintenance: "bg-amber-500/10   text-amber-600    dark:text-amber-400   border-amber-500/20",
};

export const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  single:    "Single",
  double:    "Double",
  triple:    "Triple",
  dormitory: "Dormitory",
};

export function avatarColor(id: string): string {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-blue-500",  "bg-sky-500",
    "bg-teal-500",   "bg-emerald-500","bg-rose-500",  "bg-orange-500",
    "bg-amber-500",  "bg-pink-500",   "bg-cyan-500",  "bg-lime-600",
  ];
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
