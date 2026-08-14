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
  CalendarOff,
  Award,
  CalendarRange,
  FileText,
  IdCard,
  FolderOpen,
  History,
  X,
  MessageSquareWarning,
  Images,
  Gauge,
  UserCog,
  LifeBuoy,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";
import { SchoolSwitcher } from "./school-switcher";
import packageJson from "@/package.json";

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
    {
      group: "Revenue",
      items: [
        { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
        { label: "Invoices",      href: "/dashboard/invoices",      icon: Receipt },
      ],
    },
    {
      group: "Growth & Health",
      items: [
        { label: "Platform Analytics", href: "/dashboard/platform-analytics", icon: TrendingUp },
        { label: "Usage",              href: "/dashboard/usage",              icon: Gauge },
      ],
    },
    {
      group: "Support",
      items: [
        { label: "Support Requests", href: "/dashboard/support",                icon: MessageSquareWarning },
        { label: "Announcements",    href: "/dashboard/platform-announcements", icon: Megaphone },
      ],
    },
    {
      group: "Administration",
      items: [
        { label: "Platform Team", href: "/dashboard/team",      icon: UserCog },
        { label: "Audit Log",     href: "/dashboard/audit-log", icon: History },
        { label: "Settings",      href: "/dashboard/settings",  icon: Settings },
      ],
    },
  ],
  super_admin: [
    {
      items: [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "Institution",
      items: [
        { label: "Schools",                  href: "/dashboard/schools",   icon: Landmark },
        { label: "Principals & School Admins", href: "/dashboard/principals", icon: UserCog },
      ],
    },
    {
      group: "People",
      items: [
        { label: "Staff",           href: "/dashboard/staff",      icon: Users },
        { label: "Leave Approvals", href: "/dashboard/leaves",     icon: CalendarOff },
        { label: "Admissions",      href: "/dashboard/admissions", icon: UserPlus },
      ],
    },
    {
      group: "Academics",
      items: [
        { label: "Academic Calendar", href: "/dashboard/academic-calendar", icon: CalendarRange },
        { label: "Exams & Results",   href: "/dashboard/exams",             icon: ClipboardCheck },
      ],
    },
    {
      group: "Finance",
      items: [
        { label: "Billing & Subscription", href: "/dashboard/billing",        icon: CreditCard },
        { label: "Fee Collection",         href: "/dashboard/fee-collection", icon: Receipt },
      ],
    },
    {
      group: "Reports & Analytics",
      items: [
        { label: "Reports",   href: "/dashboard/reports",   icon: FileBarChart },
        { label: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements",       href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",            href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Documents & Circulars", href: "/dashboard/documents",   icon: FolderOpen },
        { label: "Grievances",          href: "/dashboard/grievances",    icon: MessageSquareWarning },
      ],
    },
    {
      group: "Administration",
      items: [
        { label: "Settings",       href: "/dashboard/settings",  icon: Settings },
        { label: "Audit Log",      href: "/dashboard/audit-log", icon: History },
        { label: "Help & Support", href: "/dashboard/help",      icon: LifeBuoy },
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
        { label: "Students",         href: "/dashboard/students", icon: GraduationCap },
        { label: "Staff",            href: "/dashboard/staff",    icon: Briefcase },
        { label: "Parents",          href: "/dashboard/parents",  icon: Users2 },
        { label: "Leave Management", href: "/dashboard/leaves",   icon: CalendarOff },
      ],
    },
    {
      group: "Academics",
      items: [
        { label: "Classes & Sections", href: "/dashboard/classes",            icon: Layers },
        { label: "Subjects",           href: "/dashboard/subjects",           icon: BookMarked },
        { label: "Timetable",          href: "/dashboard/timetable",          icon: CalendarDays },
        { label: "Exams & Results",    href: "/dashboard/exams",              icon: ClipboardCheck },
        { label: "Academic Calendar",  href: "/dashboard/academic-calendar",  icon: CalendarRange },
        { label: "Certificates",       href: "/dashboard/certificates",       icon: Award },
        { label: "Homework",          href: "/dashboard/homework",           icon: FileText },
        { label: "ID Cards",          href: "/dashboard/id-cards",           icon: IdCard },
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
        { label: "Documents & Circulars",   href: "/dashboard/documents", icon: FolderOpen },
        { label: "Grievances",        href: "/dashboard/grievances",    icon: MessageSquareWarning },
      ],
    },
    {
      group: "Facilities",
      items: [
        { label: "Transport",  href: "/dashboard/transport",  icon: Bus },
        { label: "Library",    href: "/dashboard/library",    icon: Library },
        { label: "Hostel",     href: "/dashboard/hostel",     icon: BedDouble },
        { label: "Inventory",  href: "/dashboard/inventory",  icon: Package },
        { label: "Website Gallery", href: "/dashboard/gallery", icon: Images },
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
        { label: "Settings",   href: "/dashboard/settings",   icon: Settings },
        { label: "Audit Log",  href: "/dashboard/audit-log",  icon: History },
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
        { label: "Homework",   href: "/dashboard/homework",   icon: FileText },
        { label: "Timetable",  href: "/dashboard/timetable",  icon: CalendarDays },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "PTM",      href: "/dashboard/ptm",      icon: Users2 },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ],
    },
    {
      group: "Self Service",
      items: [
        { label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
      ],
    },
  ],
  parent: [
    {
      items: [
        { label: "Overview",     href: "/dashboard",          icon: LayoutDashboard },
        { label: "My Children",  href: "/dashboard/children", icon: Heart },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "PTM",      href: "/dashboard/ptm",      icon: Users2 },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ],
    },
    {
      group: "Finance & Reports",
      items: [
        { label: "Fees",    href: "/dashboard/fees",    icon: CreditCard },
        { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
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
        { label: "Homework",   href: "/dashboard/homework",   icon: FileText },
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
    {
      group: "Communication",
      items: [
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ],
    },
    {
      group: "Self Service",
      items: [
        { label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff },
      ],
    },
  ],
};

const STAFF_TEMPLATE_NAV: Record<string, NavGroup[]> = {
  librarian: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      group: "Workspace",
      items: [{ label: "Library", href: "/dashboard/library", icon: Library }],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",      href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Documents",     href: "/dashboard/documents",     icon: FolderOpen },
      ],
    },
    { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
  ],
  warden: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      group: "Workspace",
      items: [{ label: "Hostel", href: "/dashboard/hostel", icon: BedDouble }],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",      href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Documents",     href: "/dashboard/documents",     icon: FolderOpen },
      ],
    },
    { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
  ],
  accountant: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
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
        { label: "Messages",  href: "/dashboard/messages",  icon: MessageSquare },
        { label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
      ],
    },
    { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
  ],
  hr_manager: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      group: "People",
      items: [
        { label: "Staff Directory",  href: "/dashboard/staff",  icon: Briefcase },
        { label: "Leave Approvals",  href: "/dashboard/leaves", icon: CalendarOff },
      ],
    },
    {
      group: "Finance",
      items: [{ label: "Payroll", href: "/dashboard/payroll", icon: Wallet }],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",      href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Documents",     href: "/dashboard/documents",     icon: FolderOpen },
      ],
    },
  ],
  receptionist: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      group: "Front Desk",
      items: [{ label: "Admissions", href: "/dashboard/admissions", icon: UserPlus }],
    },
    {
      group: "Communication",
      items: [
        { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
        { label: "Messages",      href: "/dashboard/messages",      icon: MessageSquare },
        { label: "Documents",     href: "/dashboard/documents",     icon: FolderOpen },
      ],
    },
    { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
  ],
  lab_assistant: [
    { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
    {
      group: "Workspace",
      items: [{ label: "Inventory", href: "/dashboard/inventory", icon: Package }],
    },
    {
      group: "Communication",
      items: [
        { label: "Messages",  href: "/dashboard/messages",  icon: MessageSquare },
        { label: "Documents", href: "/dashboard/documents", icon: FolderOpen },
      ],
    },
    { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
  ],
};

const STAFF_DEFAULT_NAV: NavGroup[] = [
  { items: [{ label: "Overview", href: "/dashboard", icon: LayoutDashboard }] },
  {
    group: "Communication",
    items: [
      { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
      { label: "Messages",      href: "/dashboard/messages",      icon: MessageSquare },
      { label: "Documents",     href: "/dashboard/documents",     icon: FolderOpen },
    ],
  },
  { group: "Self Service", items: [{ label: "Leaves", href: "/dashboard/leaves", icon: CalendarOff }] },
];

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

export function Sidebar({
  role, user, open, onClose, schools, activeSchoolId,
}: {
  role: string;
  user: User;
  open: boolean;
  onClose: () => void;
  schools?: { id: string; name: string }[];
  activeSchoolId?: string | null;
}) {
  const pathname = usePathname();
  const staffTemplateId = user.user_metadata?.staff_template_id as string | undefined;
  const navGroups =
    role === "staff"
      ? (staffTemplateId && STAFF_TEMPLATE_NAV[staffTemplateId]) || STAFF_DEFAULT_NAV
      : NAV[role] ?? NAV.student;
  const meta = ROLE_META[role] ?? ROLE_META.student;
  const roleLabel =
    role === "staff"
      ? (user.user_metadata?.staff_type as string | undefined) ?? meta.label
      : meta.label;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col border-r border-primary-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo */}
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-primary-100 dark:border-zinc-800 px-5">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <div className="flex-1 leading-tight">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-50">Shikshaloy</p>
          <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-600">v{packageJson.version}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {role === "super_admin" && schools && schools.length > 1 && (
        <div className="border-b border-primary-100 dark:border-zinc-800 pt-3">
          <SchoolSwitcher schools={schools} activeSchoolId={activeSchoolId ?? null} />
        </div>
      )}

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
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold"
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
      <div className="shrink-0 border-t border-primary-100 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-center gap-2.5 px-1 py-1">
          <img
            src="/user-profile-icon.svg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900 dark:text-zinc-50">
              {(user.user_metadata?.full_name as string) || roleLabel}
            </p>
            <p className="truncate text-[10px] text-primary-500 dark:text-zinc-500">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
      </aside>
    </>
  );
}
