export type ContactRole = "admin" | "super_admin" | "staff" | "teacher" | "parent" | "student" | "driver" | "kernel";

export interface MessageEntry {
  id: string;
  fromMe: boolean;
  text: string;
  time: string; // ISO
}

export interface Contact {
  profileId: string;
  name: string;
  role: ContactRole;
}

export interface Conversation {
  id: string;
  contact: Contact;
  lastMessage: string;
  lastTime: string; // ISO
  unread: number;
  messages: MessageEntry[];
}

export const ROLE_LABEL: Record<ContactRole, string> = {
  kernel: "Kernel",
  super_admin: "Institution Owner",
  admin: "Principal",
  staff: "Staff",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
  driver: "Driver",
};

export const ROLE_BADGE: Record<ContactRole, string> = {
  kernel: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  super_admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  staff: "bg-orange-500/10  text-orange-600  dark:text-orange-400",
  teacher: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  parent: "bg-rose-500/10    text-rose-600    dark:text-rose-400",
  student: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  driver: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export const ROLE_AVATAR: Record<ContactRole, string> = {
  kernel: "bg-indigo-500",
  super_admin: "bg-violet-500",
  admin: "bg-blue-500",
  staff: "bg-orange-500",
  teacher: "bg-emerald-500",
  parent: "bg-rose-500",
  student: "bg-sky-500",
  driver: "bg-teal-500",
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000);
  if (diff === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
