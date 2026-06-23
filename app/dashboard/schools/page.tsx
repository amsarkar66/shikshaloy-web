"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Landmark, MapPin, GraduationCap, Briefcase,
  BadgeCheck, Clock, XCircle, Plus, Search,
  ChevronRight, Building2, Phone, Globe,
  Mail, TrendingUp, TrendingDown, Users,
  SlidersHorizontal, MoreHorizontal,
  Edit2, Eye, Trash2, UserCog,
} from "lucide-react";

// ── Mock data — replace with DB queries when tables are ready ─────────────────

type SchoolStatus = "active" | "inactive" | "pending";

interface School {
  id: string;
  name: string;
  shortName: string;
  location: string;
  city: string;
  state: string;
  type: string;
  phone: string;
  email: string;
  website?: string;
  principal: string;
  principalEmail: string;
  admins: number;
  students: number;
  staff: number;
  attendance: number;
  feePct: number;
  monthlyRevenue: number;
  status: SchoolStatus;
  established: string;
  grades: string;
}

const SCHOOLS: School[] = [
  {
    id: "1",
    name: "Sunrise Academy — Main Campus",
    shortName: "Main Campus",
    location: "Park Street, Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    type: "CBSE",
    phone: "+91 33 2217 4400",
    email: "main@sunriseacademy.edu.in",
    website: "sunriseacademy.edu.in",
    principal: "Dr. Subrata Roy",
    principalEmail: "subrata.roy@sunriseacademy.edu.in",
    admins: 4,
    students: 1584,
    staff: 108,
    attendance: 95,
    feePct: 87,
    monthlyRevenue: 554400,
    status: "active",
    established: "2004",
    grades: "Pre-KG – XII",
  },
  {
    id: "2",
    name: "Sunrise Academy — Salt Lake",
    shortName: "Salt Lake",
    location: "Sector V, Salt Lake",
    city: "Kolkata",
    state: "West Bengal",
    type: "CBSE",
    phone: "+91 33 2335 9900",
    email: "saltlake@sunriseacademy.edu.in",
    principal: "Mrs. Anita Ghosh",
    principalEmail: "anita.ghosh@sunriseacademy.edu.in",
    admins: 3,
    students: 1247,
    staff: 84,
    attendance: 93,
    feePct: 82,
    monthlyRevenue: 436450,
    status: "active",
    established: "2011",
    grades: "KG – X",
  },
  {
    id: "3",
    name: "Sunrise Academy — Howrah",
    shortName: "Howrah",
    location: "Shibpur, Howrah",
    city: "Howrah",
    state: "West Bengal",
    type: "WBSEE",
    phone: "+91 33 2638 1200",
    email: "howrah@sunriseacademy.edu.in",
    principal: "Mr. Rajesh Sharma",
    principalEmail: "rajesh.sharma@sunriseacademy.edu.in",
    admins: 2,
    students: 910,
    staff: 60,
    attendance: 91,
    feePct: 76,
    monthlyRevenue: 227500,
    status: "active",
    established: "2016",
    grades: "I – XII",
  },
];

// ── Stat bar ──────────────────────────────────────────────────────────────────

function TopStats({ schools }: { schools: School[] }) {
  const totalStudents = schools.reduce((s, x) => s + x.students, 0);
  const totalStaff    = schools.reduce((s, x) => s + x.staff, 0);
  const avgAttendance = Math.round(
    schools.reduce((s, x) => s + x.attendance, 0) / (schools.length || 1)
  );
  const totalRevenue  = schools.reduce((s, x) => s + x.monthlyRevenue, 0);

  const items = [
    {
      label: "Total Schools",
      value: schools.length.toString(),
      icon: Landmark,
      accent: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Total Students",
      value: totalStudents.toLocaleString(),
      icon: GraduationCap,
      accent: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Total Staff",
      value: totalStaff.toLocaleString(),
      icon: Briefcase,
      accent: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Avg Attendance",
      value: `${avgAttendance}%`,
      icon: TrendingUp,
      accent: "text-sky-500 bg-sky-500/10",
    },
    {
      label: "Monthly Revenue",
      value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
      icon: Users,
      accent: "text-indigo-500 bg-indigo-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3"
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.accent}`}>
            <item.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight text-gray-900 dark:text-zinc-50">{item.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SchoolStatus }) {
  const map: Record<SchoolStatus, { cls: string; icon: React.ElementType; label: string }> = {
    active:   { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: BadgeCheck, label: "Active"   },
    inactive: { cls: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-200 dark:border-zinc-700",  icon: XCircle,   label: "Inactive" },
    pending:  { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",   icon: Clock,     label: "Pending"  },
  };
  const { cls, icon: Icon, label } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
      {type}
    </span>
  );
}

// ── Mini metric ───────────────────────────────────────────────────────────────

function MiniBar({ label, value, pct, colorClass }: {
  label: string; value: string; pct: number; colorClass: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-500 dark:text-zinc-400">{label}</span>
        <span className="font-semibold text-gray-700 dark:text-zinc-300">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
        <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── School card ───────────────────────────────────────────────────────────────

function SchoolCard({ school, onMenu }: { school: School; onMenu: (id: string) => void }) {
  const attendanceColor =
    school.attendance >= 95 ? "bg-emerald-500" :
    school.attendance >= 90 ? "bg-blue-500" : "bg-amber-500";
  const feeColor =
    school.feePct >= 85 ? "bg-emerald-500" :
    school.feePct >= 75 ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className="group rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-violet-200 dark:hover:border-violet-500/30">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate leading-tight">
              {school.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <TypeBadge type={school.type} />
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">Est. {school.established}</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">· {school.grades}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={school.status} />
          <button
            onClick={() => onMenu(school.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Location + contact */}
      <div className="space-y-1.5 text-xs text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-400" />
          {school.location}, {school.city}, {school.state}
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0 text-violet-400" />
          {school.phone}
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 shrink-0 text-violet-400" />
          {school.email}
        </div>
        {school.website && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            {school.website}
          </div>
        )}
      </div>

      {/* Principal */}
      <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <UserCog className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-zinc-50 truncate">{school.principal}</p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500 truncate">{school.principalEmail}</p>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Students", value: school.students.toLocaleString(), icon: GraduationCap, color: "text-blue-500" },
          { label: "Staff",    value: school.staff.toString(),          icon: Briefcase,      color: "text-emerald-500" },
          { label: "Admins",   value: school.admins.toString(),         icon: UserCog,        color: "text-violet-500" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 py-2 px-1">
            <m.icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${m.color}`} />
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{m.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Performance bars */}
      <div className="space-y-2.5">
        <MiniBar
          label="Today's attendance"
          value={`${school.attendance}%`}
          pct={school.attendance}
          colorClass={attendanceColor}
        />
        <MiniBar
          label="Fee collection"
          value={`${school.feePct}%`}
          pct={school.feePct}
          colorClass={feeColor}
        />
      </div>

      {/* Revenue + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        <div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Monthly revenue</p>
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">
            ₹{(school.monthlyRevenue / 100000).toFixed(1)}L
          </p>
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors">
          Manage <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

function ContextMenu({ schoolId, onClose }: { schoolId: string; onClose: () => void }) {
  const actions = [
    { icon: Eye,    label: "View details",    cls: "text-gray-700 dark:text-zinc-300" },
    { icon: Edit2,  label: "Edit school",     cls: "text-gray-700 dark:text-zinc-300" },
    { icon: UserCog,label: "Manage admins",   cls: "text-gray-700 dark:text-zinc-300" },
    { icon: Trash2, label: "Remove school",   cls: "text-red-600 dark:text-red-400"   },
  ];
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={onClose}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors ${a.cls}`}
          >
            <a.icon className="h-3.5 w-3.5 shrink-0" />
            {a.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Compare table ─────────────────────────────────────────────────────────────

function CompareTable({ schools }: { schools: School[] }) {
  if (schools.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">School comparison</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-zinc-800">
              {["School", "Board", "Students", "Staff", "Attendance", "Fee %", "Revenue", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-violet-500 dark:text-zinc-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map((s, i) => {
              const attendanceColor =
                s.attendance >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                s.attendance >= 90 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400";
              const feeColor =
                s.feePct >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                s.feePct >= 75 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400";
              return (
                <tr key={s.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700/30 ${i < schools.length - 1 ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-zinc-50 whitespace-nowrap">{s.shortName}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500">{s.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={s.type} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">
                    {s.students.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-zinc-300">
                    {s.staff}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${attendanceColor}`}>
                    {s.attendance}%
                  </td>
                  <td className={`px-4 py-3 font-semibold ${feeColor}`}>
                    {s.feePct}%
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                    ₹{(s.monthlyRevenue / 100000).toFixed(1)}L
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SchoolsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SchoolStatus>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = SCHOOLS.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.principal.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top stats */}
      <TopStats schools={filtered} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools, cities, principals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
          {(["all", "active", "inactive", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sort
          </button>
          <Link
            href="/dashboard/schools/new"
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-600 transition-colors shadow shadow-violet-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add School
          </Link>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          {filtered.length} {filtered.length === 1 ? "school" : "schools"}
          {search && ` matching "${search}"`}
        </p>
        {(search || statusFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">No schools found</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((school) => (
            <div key={school.id} className="relative">
              <SchoolCard school={school} onMenu={(id) => setOpenMenu(openMenu === id ? null : id)} />
              {openMenu === school.id && (
                <ContextMenu schoolId={school.id} onClose={() => setOpenMenu(null)} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {filtered.length > 1 && <CompareTable schools={filtered} />}
    </div>
  );
}
