"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  ClipboardList,
  CreditCard,
  BarChart3,
  Shield,
  Settings,
  Heart,
  FileBarChart,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  kernal: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Institutions", href: "/dashboard/institutions", icon: Building2 },
  ],
  super_admin: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/students", icon: Users },
    { label: "Staff", href: "/dashboard/staff", icon: Users },
    { label: "Classes", href: "/dashboard/classes", icon: BookOpen },
    { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
  ],
  admin: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/dashboard/students", icon: Users },
    { label: "Staff", href: "/dashboard/staff", icon: Users },
    { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  ],
  teacher: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Classes", href: "/dashboard/classes", icon: BookOpen },
    { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
    { label: "Grades", href: "/dashboard/grades", icon: BarChart3 },
  ],
  parent: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Children", href: "/dashboard/children", icon: Heart },
    { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
    { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  ],
  student: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Classes", href: "/dashboard/classes", icon: BookOpen },
    { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
    { label: "Grades", href: "/dashboard/grades", icon: BarChart3 },
  ],
};

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  kernal:    { label: "Kernal",      icon: Shield,        color: "text-indigo-400 bg-indigo-500/20 ring-indigo-500/30" },
  super_admin: { label: "Super Admin", icon: Building2,   color: "text-violet-400 bg-violet-500/20 ring-violet-500/30" },
  admin:     { label: "Admin",       icon: Settings,      color: "text-blue-400   bg-blue-500/20   ring-blue-500/30"   },
  teacher:   { label: "Teacher",     icon: BookOpen,      color: "text-emerald-400 bg-emerald-500/20 ring-emerald-500/30" },
  parent:    { label: "Parent",      icon: Heart,         color: "text-rose-400   bg-rose-500/20   ring-rose-500/30"   },
  student:   { label: "Student",     icon: GraduationCap, color: "text-amber-400  bg-amber-500/20  ring-amber-500/30"  },
};

export function Sidebar({ role, user }: { role: string; user: User }) {
  const pathname = usePathname();
  const navItems = NAV[role] ?? NAV.student;
  const meta = ROLE_META[role] ?? ROLE_META.student;
  const RoleIcon = meta.icon;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-black/20">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow shadow-indigo-500/40">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-white">Shikshaloy</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
            {meta.label}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-indigo-500/15 text-white"
                  : "text-indigo-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-400" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ${meta.color}`}>
            <RoleIcon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">
              {(user.user_metadata?.full_name as string) || meta.label}
            </p>
            <p className="truncate text-[10px] text-indigo-500">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
