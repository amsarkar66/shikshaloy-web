import { Crown, Landmark, GraduationCap, Briefcase, BookOpen, Heart, Bus, type LucideIcon } from "lucide-react";

export interface DemoAccount {
  slug: string;
  role: string;
  label: string;
  email: string;
  password: string;
  icon: LucideIcon;
  accent: string;
  ring: string;
  pitch: string;
  highlights: string[];
}

// Every account below already exists in Supabase auth (created via
// scripts/seed-*.mjs) and is permanently scoped to the demo school
// (00000000-0000-0000-0000-000000000001), whose data is wiped and
// re-seeded every night at IST midnight by the `reset_demo_school()`
// Postgres function (see supabase/migrations) — the same mechanism a
// kernel account can trigger on demand from the dashboard.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    slug: "super_admin",
    role: "super_admin",
    label: "Super Admin",
    email: "superadmin@shikshaloy.com",
    password: "SuperAdmin@123",
    icon: Crown,
    accent: "text-violet-600 bg-violet-50",
    ring: "ring-violet-100",
    pitch: "Multi-school control, subscriptions, and platform-wide analytics.",
    highlights: ["Multi-school management", "Subscription & billing", "Platform analytics", "Global settings"],
  },
  {
    slug: "admin",
    role: "admin",
    label: "Admin",
    email: "admin@shikshaloy.com",
    password: "Admin@123",
    icon: Landmark,
    accent: "text-primary-600 bg-primary-50",
    ring: "ring-primary-100",
    pitch: "Run the whole school — students, staff, fees, and timetables.",
    highlights: ["Student & staff management", "Fee & expense tracking", "Timetable builder", "Reports & compliance"],
  },
  {
    slug: "teacher",
    role: "teacher",
    label: "Teacher",
    email: "teacher@shikshaloy.com",
    password: "Teacher@123",
    icon: GraduationCap,
    accent: "text-sky-600 bg-sky-50",
    ring: "ring-sky-100",
    pitch: "Attendance, homework, grading, and parent messaging.",
    highlights: ["Digital attendance", "Homework & assignments", "Exam & grading", "Parent communication"],
  },
  {
    slug: "staff",
    role: "staff",
    label: "Staff",
    email: "staff@shikshaloy.com",
    password: "Staff@123",
    icon: Briefcase,
    accent: "text-orange-600 bg-orange-50",
    ring: "ring-orange-100",
    pitch: "A purpose-built workspace for non-teaching roles.",
    highlights: ["Role-specific workspace", "Attendance & leave", "Documents & announcements", "Scoped permissions"],
  },
  {
    slug: "student",
    role: "student",
    label: "Student",
    email: "student@shikshaloy.com",
    password: "Student@123",
    icon: BookOpen,
    accent: "text-amber-600 bg-amber-50",
    ring: "ring-amber-100",
    pitch: "Timetable, assignments, results, and announcements.",
    highlights: ["Class timetable", "Assignments & notes", "Exam results", "Announcements"],
  },
  {
    slug: "parent",
    role: "parent",
    label: "Parent",
    email: "parent@shikshaloy.com",
    password: "Parent@123",
    icon: Heart,
    accent: "text-rose-600 bg-rose-50",
    ring: "ring-rose-100",
    pitch: "Real-time attendance, results, fees, and teacher chat.",
    highlights: ["Live attendance alerts", "Result & report card", "Online fee payment", "Direct teacher chat"],
  },
  {
    slug: "driver",
    role: "driver",
    label: "Driver",
    email: "driver@shikshaloy.com",
    password: "Driver@123",
    icon: Bus,
    accent: "text-teal-600 bg-teal-50",
    ring: "ring-teal-100",
    pitch: "Routes, transport attendance, and direct messaging.",
    highlights: ["Route & stop details", "Transport attendance", "Direct messaging", "Leave requests"],
  },
];

const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((a) => a.email));

export function isDemoAccountEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_EMAILS.has(email);
}
