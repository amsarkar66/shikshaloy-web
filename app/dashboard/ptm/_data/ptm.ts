export type PtmStatus = "scheduled" | "completed" | "cancelled";
export type BookingStatus = "booked" | "attended" | "no_show";

export interface Booking {
  id: string;
  time: string; // e.g. "4:00 PM"
  parentName: string;
  studentName: string;
  status: BookingStatus;
}

export interface PtmSession {
  id: string;
  classNum: string;
  section: string;
  teacher: string;
  date: string; // ISO
  startTime: string;
  endTime: string;
  slotMinutes: number;
  totalSlots: number;
  status: PtmStatus;
  bookings: Booking[];
}

export const STATUS_BADGE: Record<PtmStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20" },
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-zinc-500/10    text-zinc-600    dark:text-zinc-400    border-zinc-500/20" },
};

export const BOOKING_STATUS_BADGE: Record<BookingStatus, { label: string; cls: string }> = {
  booked:   { label: "Booked",   cls: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20" },
  attended: { label: "Attended", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  no_show:  { label: "No-show",  cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20" },
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
