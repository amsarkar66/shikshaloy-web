"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  Users2,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  Heart,
  FileBarChart,
  Briefcase,
  Calendar,
  CalendarDays,
  MapPin,
  Bus,
  Landmark,
  Layers,
  BookMarked,
  UserCheck,
  UserPlus,
  Receipt,
  Wallet,
  Megaphone,
  MessageSquare,
  Library,
  BedDouble,
  Package,
  TrendingUp,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: "soon" };
type NavGroup = { group?: string; items: NavItem[] };

const NAV: Record<string, NavGroup[]> = {
  kernel: [
    {
      items: [
        { label: "Overview",     href: "/dashboard",              icon: LayoutDashboard },
        { label: "Institutions", href: "/dashboard/institutions", icon: Building2 },
      ],
    },
  ],
  super_admin: [
    {
      items: [
        { label: "Overview",  href: "/dashboard",          icon: LayoutDashboard },
        { label: "Schools",   href: "/dashboard/schools",  icon: Landmark },
        { label: "Staff",     href: "/dashboard/staff",    icon: Users },
        { label: "Billing",   href: "/dashboard/billing",  icon: CreditCard },
        { label: "Settings",  href: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "People",
      items: [
        { label: "Students", href: "/dashboard/students", icon: GraduationCap },
        { label: "Staff",    href: "/dashboard/staff",    icon: Briefcase },
        { label: "Parents",  href: "/dashboard/parents",  icon: Users2 },
      ],
    },
    {
      group: "Academics",
      items: [
        { label: "Classes & Sections", href: "/dashboard/classes",   icon: Layers },
        { label: "Subjects",           href: "/dashboard/subjects",  icon: BookMarked },
        { label: "Timetable",          href: "/dashboard/timetable", icon: CalendarDays },
        { label: "Exams & Results",    href: "/dashboard/exams",     icon: ClipboardCheck },
      ],
    },
    {
      group: "Attendance",
      items: [
        { label: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
      ],
    },
    {
      group: "Admissions",
      items: [
        { label: "Admissions", href: "/dashboard/admissions", icon: UserPlus },
      ],
    },
    {
      group: "Finance",
      items: [
        { label: "Fee Management", href: "/dashboard/fees",     icon: CreditCard },
        { label: "Expenses",       href: "/dashboard/expenses", icon: Receipt },
        { label: "Payroll",        href: "/dashboard/payroll",  icon: Wallet },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements",     href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",          href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Events & Calendar", href: "/dashboard/events",        icon: Calendar },
      ],
    },
    {
      group: "Facilities",
      items: [
        { label: "Transport",  href: "/dashboard/transport",  icon: Bus },
        { label: "Library",    href: "/dashboard/library",    icon: Library },
        { label: "Hostel",     href: "/dashboard/hostel",     icon: BedDouble },
        { label: "Inventory",  href: "/dashboard/inventory",  icon: Package },
      ],
    },
    {
      group: "Reports",
      items: [
        { label: "Reports",   href: "/dashboard/reports",   icon: FileBarChart },
        { label: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
      ],
    },
    {
      group: "Administration",
      items: [
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ],
  staff: [
    {
      items: [
        { label: "Overview", href: "/dashboard",         icon: LayoutDashboard },
        { label: "Reports",  href: "/dashboard/reports", icon: FileBarChart },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { label: "Overview",   href: "/dashboard",            icon: LayoutDashboard },
        { label: "My Classes", href: "/dashboard/classes",    icon: BookOpen },
        { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
        { label: "Grades",     href: "/dashboard/grades",     icon: BarChart3 },
        { label: "Timetable",  href: "/dashboard/timetable",  icon: CalendarDays },
      ],
    },
  ],
  parent: [
    {
      items: [
        { label: "Overview",     href: "/dashboard",          icon: LayoutDashboard },
        { label: "My Children",  href: "/dashboard/children", icon: Heart },
        { label: "Fees",         href: "/dashboard/fees",     icon: CreditCard },
        { label: "Reports",      href: "/dashboard/reports",  icon: FileBarChart },
      ],
    },
  ],
  student: [
    {
      items: [
        { label: "Overview",   href: "/dashboard",            icon: LayoutDashboard },
        { label: "My Classes", href: "/dashboard/classes",    icon: BookOpen },
        { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
        { label: "Grades",     href: "/dashboard/grades",     icon: BarChart3 },
        { label: "Timetable",  href: "/dashboard/timetable",  icon: CalendarDays },
      ],
    },
  ],
  driver: [
    {
      items: [
        { label: "Overview",   href: "/dashboard",            icon: LayoutDashboard },
        { label: "My Routes",  href: "/dashboard/routes",     icon: MapPin },
        { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
      ],
    },
  ],
};

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  kernel:      { label: "Product Owner",     icon: Shield,        color: "text-indigo-500  bg-indigo-500/20  ring-indigo-500/30"  },
  super_admin: { label: "Institution Owner", icon: Building2,     color: "text-violet-500  bg-violet-500/20  ring-violet-500/30"  },
  admin:       { label: "Principal",         icon: Landmark,      color: "text-blue-500    bg-blue-500/20    ring-blue-500/30"    },
  staff:       { label: "Staff Manager",     icon: Briefcase,     color: "text-orange-500  bg-orange-500/20  ring-orange-500/30"  },
  teacher:     { label: "Teacher",           icon: BookOpen,      color: "text-emerald-500 bg-emerald-500/20 ring-emerald-500/30" },
  parent:      { label: "Parent",            icon: Heart,         color: "text-rose-500    bg-rose-500/20    ring-rose-500/30"    },
  student:     { label: "Student",           icon: GraduationCap, color: "text-sky-500     bg-sky-500/20     ring-sky-500/30"     },
  driver:      { label: "Driver",            icon: Bus,           color: "text-teal-500    bg-teal-500/20    ring-teal-500/30"    },
};

export function Sidebar({ role, user }: { role: string; user: User }) {
  const pathname = usePathname();
  const navGroups = NAV[role] ?? NAV.student;
  const meta = ROLE_META[role] ?? ROLE_META.student;
  const RoleIcon = meta.icon;
  const roleLabel =
    role === "staff"
      ? (user.user_metadata?.staff_type as string | undefined) ?? meta.label
      : meta.label;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-indigo-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-indigo-100 dark:border-zinc-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow shadow-indigo-500/40">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-50">Shikshaloy</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-zinc-400">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((navGroup, gi) => (
          <div key={gi}>
            {navGroup.group && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {navGroup.group}
              </p>
            )}
            <div className="space-y-0.5">
              {navGroup.items.map(({ label, href, icon: Icon, badge }) => {
                const active = pathname === href;
                const isSoon = badge === "soon";
                return isSoon ? (
                  <div
                    key={href}
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium opacity-35 text-zinc-500 dark:text-zinc-500"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                      soon
                    </span>
                  </div>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-indigo-100 dark:border-zinc-800 p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${meta.color}`}>
            <RoleIcon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-900 dark:text-zinc-50">
              {(user.user_metadata?.full_name as string) || roleLabel}
            </p>
            <p className="truncate text-[10px] text-indigo-500 dark:text-zinc-500">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
