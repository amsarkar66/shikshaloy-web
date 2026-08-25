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
  MessageSquareWarning,
  Images,
  Gauge,
  UserCog,
  LifeBuoy,
  DoorOpen,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: React.ElementType; badge?: "soon" };
export type NavGroup = { group?: string; items: NavItem[] };

export const NAV: Record<string, NavGroup[]> = {
  kernel: [
    {
      items: [
        { label: "Overview",     href: "/dashboard",              icon: LayoutDashboard },
        { label: "Institutions", href: "/dashboard/institutions", icon: Building2 },
        { label: "Users",        href: "/dashboard/users",        icon: Users },
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
        { label: "Principals & Admins", href: "/dashboard/principals", icon: UserCog },
      ],
    },
    {
      group: "People",
      items: [
        { label: "Staff",           href: "/dashboard/staff",      icon: Users },
        { label: "Leave Approvals", href: "/dashboard/leaves",     icon: CalendarOff },
        { label: "Admissions",      href: "/dashboard/admissions", icon: UserPlus },
        { label: "Front Desk",      href: "/dashboard/front-desk", icon: DoorOpen },
      ],
    },
    {
      group: "Academics",
      items: [
        { label: "Academic Calendar", href: "/dashboard/academic-calendar", icon: CalendarRange },
        { label: "Exams & Results",   href: "/dashboard/exams",             icon: ClipboardCheck },
        { label: "Grades",            href: "/dashboard/grades",            icon: BarChart3 },
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
        { label: "Grades",             href: "/dashboard/grades",             icon: BarChart3 },
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
        { label: "Front Desk", href: "/dashboard/front-desk", icon: DoorOpen },
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
        { label: "Drivers",    href: "/dashboard/drivers",    icon: UserCog },
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

export const STAFF_TEMPLATE_NAV: Record<string, NavGroup[]> = {
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
      items: [
        { label: "Admissions", href: "/dashboard/admissions", icon: UserPlus },
        { label: "Front Desk", href: "/dashboard/front-desk", icon: DoorOpen },
      ],
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

export const STAFF_DEFAULT_NAV: NavGroup[] = [
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

export const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  kernel:      { label: "Product Owner",     icon: Shield,        color: "text-indigo-500  bg-indigo-500/20  ring-indigo-500/30"  },
  super_admin: { label: "Institution Owner", icon: Building2,     color: "text-violet-500  bg-violet-500/20  ring-violet-500/30"  },
  admin:       { label: "Principal",         icon: Landmark,      color: "text-blue-500    bg-blue-500/20    ring-blue-500/30"    },
  staff:       { label: "Staff Manager",     icon: Briefcase,     color: "text-orange-500  bg-orange-500/20  ring-orange-500/30"  },
  teacher:     { label: "Teacher",           icon: BookOpen,      color: "text-emerald-500 bg-emerald-500/20 ring-emerald-500/30" },
  parent:      { label: "Parent",            icon: Heart,         color: "text-rose-500    bg-rose-500/20    ring-rose-500/30"    },
  student:     { label: "Student",           icon: GraduationCap, color: "text-sky-500     bg-sky-500/20     ring-sky-500/30"     },
  driver:      { label: "Driver",            icon: Bus,           color: "text-teal-500    bg-teal-500/20    ring-teal-500/30"    },
};

/** Resolves the nav groups a given role (and, for staff, their staff template) should see. */
export function getNavGroupsForRole(role: string, staffTemplateId?: string): NavGroup[] {
  if (role === "staff") {
    return (staffTemplateId && STAFF_TEMPLATE_NAV[staffTemplateId]) || STAFF_DEFAULT_NAV;
  }
  return NAV[role] ?? NAV.student;
}
