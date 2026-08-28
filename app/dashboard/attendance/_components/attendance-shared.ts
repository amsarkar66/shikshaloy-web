import { Pencil, ScanLine, Radio, Fingerprint } from "lucide-react";
import type { AttendanceSource } from "@/lib/attendance/resolve";

export type AttendanceStatus = "present" | "absent" | "late" | "unmarked";

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (cell: string | number) => `"${String(cell).replace(/"/g,'""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
export function uuidAvatarColor(id: string) { const n=id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
export function nameInitials(name: string)  { return name.split(" ").slice(0,2).map((w)=>w[0]).join("").toUpperCase(); }

export function toLocalDateStr(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
export function todayStr() { return toLocalDateStr(new Date()); }
export function addDays(d: string, n: number) { const dt=new Date(d+"T00:00:00"); dt.setDate(dt.getDate()+n); return toLocalDateStr(dt); }
export function formatLong(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
export function formatTime(iso?: string | null) { return iso ? new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}) : "—"; }

export function rateColor(r: number) { if(r>=90)return"text-emerald-600 dark:text-emerald-400";if(r>=80)return"text-amber-600 dark:text-amber-400";return"text-red-600 dark:text-red-400"; }
export function rateBar(r: number)   { if(r>=90)return"bg-emerald-500";if(r>=80)return"bg-amber-500";return"bg-red-500"; }

export const STATUS: Record<AttendanceStatus,{label:string;active:string;ghost:string;dot:string}> = {
  present:  { label:"Present",    active:"bg-emerald-500 text-white border-emerald-500", ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400", dot:"bg-emerald-500" },
  late:     { label:"Late",       active:"bg-amber-500  text-white border-amber-500",    ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400  hover:text-amber-600  dark:hover:text-amber-400",  dot:"bg-amber-500"  },
  absent:   { label:"Absent",     active:"bg-red-500    text-white border-red-500",      ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400",    dot:"bg-red-500"    },
  unmarked: { label:"Not Marked", active:"bg-gray-400   text-white border-gray-400",     ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400", dot:"bg-gray-400"   },
};
export const STATUS_BADGE: Record<AttendanceStatus,string> = {
  present:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:     "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:   "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  unmarked: "bg-gray-500/10    text-gray-500    dark:text-zinc-400    border-gray-500/20",
};

export const SOURCE_META: Record<AttendanceSource, { label: string; icon: typeof Pencil }> = {
  manual:    { label: "Manual",    icon: Pencil },
  qr:        { label: "QR",        icon: ScanLine },
  rfid:      { label: "RFID",      icon: Radio },
  biometric: { label: "Biometric", icon: Fingerprint },
};
