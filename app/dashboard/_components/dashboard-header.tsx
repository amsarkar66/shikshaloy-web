"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "./theme-toggle";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":               { title: "Overview",      subtitle: "Welcome back" },
  "/dashboard/institutions":  { title: "Institutions",  subtitle: "Manage institution accounts" },
  "/dashboard/schools":       { title: "Schools",       subtitle: "Schools under your institution" },
  "/dashboard/schools/new":   { title: "Add School",    subtitle: "Register a new school" },
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardHeader({ role, user }: { role: string; user: User }) {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Dashboard", subtitle: "" };
  const name = (user.user_metadata?.full_name as string) || user.email || "";
  const initials = getInitials(name);
  const avatarColor = ROLE_COLORS[role] ?? "bg-indigo-500";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-indigo-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6">
      {/* Left — page title */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-base font-semibold text-gray-900 dark:text-zinc-50 leading-none">
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
      <div className="flex items-center gap-1">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50">
          <Search className="h-4 w-4" />
        </button>

        <ThemeToggle />

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </button>

        <div className="ml-2 flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white ${avatarColor}`}>
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-zinc-300 md:block">
            {name.split(" ")[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
