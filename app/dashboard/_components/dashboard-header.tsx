"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings, LogOut, Menu, CheckCheck, CreditCard } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "../actions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":               { title: "Overview",      subtitle: "Welcome back" },
  "/dashboard/institutions":  { title: "Institutions",  subtitle: "Manage institution accounts" },
  "/dashboard/schools":       { title: "Schools",       subtitle: "Schools under your institution" },
  "/dashboard/schools/new":   { title: "Add School",    subtitle: "Register a new school" },
  "/dashboard/admissions":    { title: "Admissions",    subtitle: "Manage student applications and enrolments" },
  "/dashboard/admissions/new": { title: "New Application", subtitle: "Submit a new admission application" },
  "/dashboard/students":      { title: "Students",      subtitle: "Manage student records" },
  "/dashboard/staff":         { title: "Staff",         subtitle: "Manage staff members" },
  "/dashboard/classes":       { title: "Classes",       subtitle: "Manage class sections" },
  "/dashboard/attendance":    { title: "Attendance",    subtitle: "Daily attendance records" },
  "/dashboard/fees":          { title: "Fees",          subtitle: "Fee collection and tracking" },
  "/dashboard/grades":        { title: "Grades",        subtitle: "Academic performance" },
  "/dashboard/timetable":     { title: "Timetable",     subtitle: "Class schedule" },
  "/dashboard/reports":       { title: "Reports",       subtitle: "Analytics and summaries" },
  "/dashboard/children":      { title: "My Children",   subtitle: "Track your children's progress" },
  "/dashboard/routes":        { title: "My Routes",     subtitle: "Transport routes and stops" },
  "/dashboard/billing":       { title: "Billing",       subtitle: "Subscription and payments" },
  "/dashboard/settings":      { title: "Settings",      subtitle: "Account and preferences" },
  "/dashboard/subscriptions":          { title: "Subscriptions",  subtitle: "Plans and billing across every institution" },
  "/dashboard/invoices":                { title: "Invoices",       subtitle: "Platform-wide invoice history" },
  "/dashboard/platform-analytics":      { title: "Platform Analytics", subtitle: "Signups, plan mix, and approval trends" },
  "/dashboard/usage":                   { title: "Usage",          subtitle: "Plan capacity across institutions" },
  "/dashboard/support":                 { title: "Support Requests", subtitle: "Issues raised by institutions" },
  "/dashboard/platform-announcements":  { title: "Announcements",  subtitle: "Broadcast updates to every institution" },
  "/dashboard/team":                    { title: "Platform Team",  subtitle: "Shikshaloy product owner accounts" },
  "/dashboard/audit-log":               { title: "Audit Log",      subtitle: "Track who changed what, across every module" },
  "/dashboard/academic-calendar":       { title: "Academic Calendar", subtitle: "Terms, holidays, and exam windows" },
  "/dashboard/exams":                   { title: "Exams & Results", subtitle: "Manage exams and publish results" },
  "/dashboard/analytics":               { title: "Analytics",      subtitle: "Trends and performance insights" },
  "/dashboard/announcements":           { title: "Announcements",  subtitle: "Broadcast updates" },
  "/dashboard/messages":                { title: "Messages",       subtitle: "Direct conversations" },
  "/dashboard/documents":               { title: "Documents & Circulars", subtitle: "Policy and compliance documents" },
  "/dashboard/leaves":                  { title: "Leave Approvals", subtitle: "Review and approve leave requests" },
  "/dashboard/principals":              { title: "Principals & School Admins", subtitle: "Manage principal accounts across your schools" },
  "/dashboard/fee-collection":          { title: "Fee Collection", subtitle: "Dues and collection across every school" },
  "/dashboard/help":                    { title: "Help & Support", subtitle: "Reach the Shikshaloy team" },
};

const ROLE_COLORS: Record<string, string> = {
  kernel:      "bg-indigo-500",
  super_admin: "bg-violet-500",
  admin:       "bg-blue-500",
  staff:       "bg-orange-500",
  teacher:     "bg-emerald-500",
  parent:      "bg-rose-500",
  student:     "bg-sky-500",
  driver:      "bg-teal-500",
};

const ROLE_LABELS: Record<string, string> = {
  kernel:      "Product Owner",
  super_admin: "Institution Owner",
  admin:       "Principal",
  staff:       "Staff Manager",
  teacher:     "Teacher",
  parent:      "Parent",
  student:     "Student",
  driver:      "Driver",
};

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New admission application",
    description: "A new student application is awaiting your review.",
    time: "10 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Fee payment received",
    description: "A fee payment has been recorded successfully.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    title: "Attendance report ready",
    description: "Yesterday's attendance report has been generated.",
    time: "Yesterday",
    read: true,
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardHeader({
  role, user, orgName, orgLogoUrl, onMenuClick,
}: {
  role: string;
  user: User;
  orgName?: string | null;
  orgLogoUrl?: string | null;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const meta =
    PAGE_META[pathname] ??
    (/^\/dashboard\/schools\/[^/]+\/edit$/.test(pathname) ? { title: "Edit School", subtitle: "Update school profile" } :
     /^\/dashboard\/schools\/[^/]+$/.test(pathname) ? { title: "School Details", subtitle: "Overview, staff, and activity" } :
     { title: "Dashboard", subtitle: "" });
  const name = (user.user_metadata?.full_name as string) || user.email || "";
  const initials = getInitials(name);
  const avatarColor = ROLE_COLORS[role] ?? "bg-primary-500";
  const orgInitials = getInitials(orgName || name);
  const roleLabel =
    role === "staff"
      ? (user.user_metadata?.staff_type as string | undefined) ?? ROLE_LABELS[role] ?? role
      : ROLE_LABELS[role] ?? role;

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-primary-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6">
      {/* Left — page title */}
      <div className="flex min-w-0 items-baseline gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="truncate text-base font-semibold text-gray-900 dark:text-zinc-50 leading-none">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <>
            <span className="text-gray-300 dark:text-zinc-700 text-sm leading-none select-none">/</span>
            <span className="text-sm text-gray-500 dark:text-zinc-500 leading-none hidden sm:block">
              {meta.subtitle}
            </span>
          </>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50">
          <Search className="h-4 w-4" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary-500" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-medium text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="cursor-pointer flex-col items-start gap-0.5 py-2"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                    )
                  }
                >
                  <div className="flex w-full items-center gap-1.5">
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />}
                    <p className={`truncate text-sm ${n.read ? "font-normal text-muted-foreground" : "font-medium text-foreground"}`}>
                      {n.title}
                    </p>
                  </div>
                  <p className="line-clamp-2 pl-3 text-xs text-muted-foreground">{n.description}</p>
                  <p className="pl-3 text-[11px] text-muted-foreground/70">{n.time}</p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-3 h-4 w-px bg-gray-200 dark:bg-zinc-800" />

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-3 flex items-center gap-2.5 rounded-lg p-1 outline-none transition-colors hover:bg-transparent">
            <div className="hidden text-right leading-tight md:block">
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                {orgName || name.split(" ")[0]}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">{roleLabel}</p>
            </div>
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={orgName ?? "School logo"}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-[11px] font-semibold leading-none text-white">
                {orgInitials}
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="w-56">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none text-white ${avatarColor}`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/dashboard/billing" />}
              className="cursor-pointer"
            >
              <CreditCard />
              Billing & Subscription
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href="/dashboard/settings" />}
              className="cursor-pointer"
            >
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
