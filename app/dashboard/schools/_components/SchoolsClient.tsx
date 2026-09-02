"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark, MapPin, GraduationCap, Briefcase,
  BadgeCheck, Clock, XCircle, Plus, Search,
  Building2, Phone, Globe,
  TrendingUp, Users,
  MoreHorizontal,
  Edit2, Eye, Trash2, UserCog,
  Check, ArrowUp, ArrowDown, ArrowUpDown,
  LayoutGrid, List,
} from "lucide-react";
import { STATUS_BADGE, formatLakh, type School, type SchoolStatus } from "../_data/schools";
import { Table, TableHead, TableBody, Th, Td, Tr, TableTitleHeader } from "@/components/ui/data-table";
import { PlanLimitModal } from "../../_components/plan-limit-modal";
import { DeleteSchoolModal } from "./delete-school-modal";

// ── Stat bar ──────────────────────────────────────────────────────────────────

function TopStats({ schools }: { schools: School[] }) {
  const totalStudents = schools.reduce((s, x) => s + x.students, 0);
  const totalStaff = schools.reduce((s, x) => s + x.staff, 0);
  const avgAttendance = schools.length ? Math.round(schools.reduce((s, x) => s + x.attendancePct, 0) / schools.length) : 0;
  const totalRevenue = schools.reduce((s, x) => s + x.monthlyRevenue, 0);

  const items = [
    { label: "Total Schools",    value: schools.length.toString(),      icon: Landmark,     accent: "text-violet-500 bg-violet-500/10" },
    { label: "Total Students",   value: totalStudents.toLocaleString(), icon: GraduationCap, accent: "text-blue-500 bg-blue-500/10"     },
    { label: "Total Staff",      value: totalStaff.toLocaleString(),    icon: Briefcase,     accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Avg Attendance",   value: `${avgAttendance}%`,            icon: TrendingUp,    accent: "text-sky-500 bg-sky-500/10"       },
    { label: "Monthly Revenue",  value: formatLakh(totalRevenue),       icon: Users,         accent: "text-indigo-500 bg-indigo-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
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

function StatusBadge({ status }: { status: SchoolStatus }) {
  const iconMap: Record<SchoolStatus, React.ElementType> = { active: BadgeCheck, inactive: XCircle, pending: Clock };
  const Icon = iconMap[status];
  const badge = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
      <Icon className="h-3 w-3" />
      {badge.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
      {type}
    </span>
  );
}

function MiniBar({ label, value, pct, colorClass }: { label: string; value: string; pct: number; colorClass: string }) {
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

function SchoolCard({ school, onMenu, menuOpen, onRemove }: { school: School; onMenu: (id: string) => void; menuOpen: boolean; onRemove: (school: School) => void }) {
  const router = useRouter();
  const attendanceColor = school.attendancePct >= 95 ? "bg-emerald-500" : school.attendancePct >= 90 ? "bg-blue-500" : "bg-amber-500";
  const feeColor = school.feePct >= 85 ? "bg-emerald-500" : school.feePct >= 75 ? "bg-blue-500" : "bg-amber-500";

  return (
    <div
      onClick={() => router.push(`/dashboard/schools/${school.id}`)}
      className="group relative rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-violet-200 dark:hover:border-violet-500/30 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 ring-1 ring-violet-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate leading-tight">{school.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <TypeBadge type={school.institutionType} />
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">{school.establishedYear ? `Est. ${school.establishedYear}` : "Est. year not set"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={school.status} />
          <SchoolActionsMenu schoolId={school.id} open={menuOpen} onToggle={() => onMenu(school.id)} onRemove={() => onRemove(school)} />
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0 text-violet-400" />{school.city}, {school.state}, {school.country}</div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0 text-violet-400" />{school.phone}</div>
        {school.website && <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 shrink-0 text-violet-400" />{school.website}</div>}
      </div>

      <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <UserCog className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-zinc-50 truncate">{school.principalName ?? "Principal not set"}</p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500 truncate">{school.principalEmail ?? "—"}</p>
        </div>
      </div>

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

      <div className="space-y-2.5">
        <MiniBar label="Attendance (avg)" value={`${school.attendancePct}%`} pct={school.attendancePct} colorClass={attendanceColor} />
        <MiniBar label="Fee collection (latest month)" value={`${school.feePct}%`} pct={school.feePct} colorClass={feeColor} />
      </div>
    </div>
  );
}

function SchoolActionsMenu({ schoolId, open, onToggle, onRemove }: { schoolId: string; open: boolean; onToggle: () => void; onRemove: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    onToggle();
  }

  return (
    <div className="relative">
      <button ref={btnRef} onClick={handleToggle} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && pos && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div
            className="fixed z-20 w-44 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
            style={{ top: pos.top, right: pos.right }}
          >
            <Link href={`/dashboard/schools/${schoolId}`} onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              View details
            </Link>
            <Link href={`/dashboard/schools/${schoolId}/edit`} onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              Edit school
            </Link>
            <Link href="/dashboard/principals" onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <UserCog className="h-3.5 w-3.5 shrink-0" />
              Manage admins
            </Link>
            <button onClick={() => { onToggle(); onRemove(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Remove school
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TableRowActions({ schoolId, open, onToggle, onRemove }: { schoolId: string; open: boolean; onToggle: () => void; onRemove: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    onToggle();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        title="View school"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-20 w-44 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
          >
            <Link href={`/dashboard/schools/${schoolId}/edit`} onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              Edit school
            </Link>
            <Link href="/dashboard/principals" onClick={onToggle} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <UserCog className="h-3.5 w-3.5 shrink-0" />
              Manage admins
            </Link>
            <button onClick={() => { onToggle(); onRemove(); }} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors">
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Remove school
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── View toggle ──────────────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "grid" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={view === "list"}
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${view === "list" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SchoolsTable({
  schools, title, openMenu, onMenu, onRemove,
}: {
  schools: School[]; title?: string; openMenu: string | null; onMenu: (id: string) => void; onRemove: (school: School) => void;
}) {
  if (schools.length === 0) return null;
  return (
    <Table header={title ? <TableTitleHeader title={title} /> : undefined}>
      <TableHead>
        <Th position="first">School</Th>
        <Th>Type</Th>
        <Th>Principal</Th>
        <Th>Students</Th>
        <Th>Staff</Th>
        <Th>Attendance</Th>
        <Th>Fee %</Th>
        <Th>Revenue</Th>
        <Th>Status</Th>
        <Th position="last" align="right">Actions</Th>
      </TableHead>
      <TableBody>
        {schools.map((s) => {
          const attendanceColor = s.attendancePct >= 95 ? "text-emerald-600 dark:text-emerald-400" : s.attendancePct >= 90 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400";
          const feeColor = s.feePct >= 85 ? "text-emerald-600 dark:text-emerald-400" : s.feePct >= 75 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400";
          return (
            <Tr key={s.id}>
              <Td position="first">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight whitespace-nowrap">{s.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500"><MapPin className="h-3 w-3 shrink-0 text-violet-400" />{s.city}</p>
                  </div>
                </div>
              </Td>
              <Td><TypeBadge type={s.institutionType} /></Td>
              <Td>
                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">{s.principalName ?? "Not set"}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[180px]">{s.principalEmail ?? "—"}</p>
              </Td>
              <Td className="text-sm text-gray-700 dark:text-zinc-300">{s.students.toLocaleString()}</Td>
              <Td className="text-sm text-gray-700 dark:text-zinc-300">{s.staff}</Td>
              <Td className={`text-sm font-semibold ${attendanceColor}`}>{s.attendancePct}%</Td>
              <Td className={`text-sm font-semibold ${feeColor}`}>{s.feePct}%</Td>
              <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatLakh(s.monthlyRevenue)}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td position="last">
                <TableRowActions schoolId={s.id} open={openMenu === s.id} onToggle={() => onMenu(s.id)} onRemove={() => onRemove(s)} />
              </Td>
            </Tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "name" | "students" | "staff" | "attendancePct" | "feePct" | "monthlyRevenue";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name",           label: "Name" },
  { key: "students",       label: "Students" },
  { key: "staff",          label: "Staff" },
  { key: "attendancePct",  label: "Attendance" },
  { key: "feePct",         label: "Fee collection" },
  { key: "monthlyRevenue", label: "Revenue" },
];

function SortMenu({
  sortBy, sortDir, onKeyChange, onDirChange, open, onToggle,
}: {
  sortBy: SortKey; sortDir: "asc" | "desc"; open: boolean;
  onKeyChange: (key: SortKey) => void; onDirChange: (dir: "asc" | "desc") => void; onToggle: () => void;
}) {
  const activeLabel = SORT_OPTIONS.find((o) => o.key === sortBy)?.label;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ArrowUpDown className="h-3.5 w-3.5" /> Sort: {activeLabel}
        {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-56 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => onKeyChange(o.key)}
                className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
              >
                <span className="truncate">{o.label}</span>
                {o.key === sortBy && <Check className="h-3.5 w-3.5 shrink-0 text-violet-500" />}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-zinc-700/50" />
            <div className="flex items-center gap-1.5 p-1.5">
              <button
                onClick={() => onDirChange("asc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowUp className="h-3 w-3 shrink-0" /> Ascending
              </button>
              <button
                onClick={() => onDirChange("desc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowDown className="h-3 w-3 shrink-0" /> Descending
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SchoolsClient({
  schools, atSchoolCapacity, maxSchools,
}: {
  schools: School[];
  atSchoolCapacity?: boolean;
  maxSchools?: number;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SchoolStatus>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [removingSchool, setRemovingSchool] = useState<School | null>(null);

  const handleSortKeyChange = (key: SortKey) => setSortBy(key);
  const handleSortDirChange = (dir: "asc" | "desc") => setSortDir(dir);

  const filtered = schools
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || (s.principalName ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
      return (a[sortBy] - b[sortBy]) * dir;
    });

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Schools</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">All schools under your institution, at a glance</p>
        </div>
        <Link
          href="/dashboard/schools/new"
          onClick={(e) => {
            if (atSchoolCapacity) {
              e.preventDefault();
              setShowLimitModal(true);
            }
          }}
          className="sm:ml-auto flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-600 transition-colors shadow shadow-violet-500/20 w-fit"
        >
          <Plus className="h-3.5 w-3.5" /> Add School
        </Link>
      </div>

      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resource="schools"
        limit={maxSchools ?? null}
      />

      <TopStats schools={filtered} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px] sm:max-w-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools, cities, principals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
          {(["all", "active", "inactive", "pending"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SortMenu sortBy={sortBy} sortDir={sortDir} open={sortOpen} onToggle={() => setSortOpen((o) => !o)} onKeyChange={handleSortKeyChange} onDirChange={handleSortDirChange} />
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {(search || statusFilter !== "all") && (
        <div className="flex items-center gap-2">
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Clear filters</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">No schools found</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filter.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((school) => (
            <SchoolCard key={school.id} school={school} menuOpen={openMenu === school.id} onMenu={(id) => setOpenMenu(openMenu === id ? null : id)} onRemove={setRemovingSchool} />
          ))}
        </div>
      ) : (
        <SchoolsTable schools={filtered} openMenu={openMenu} onMenu={(id) => setOpenMenu(openMenu === id ? null : id)} onRemove={setRemovingSchool} />
      )}

      {viewMode === "grid" && filtered.length > 1 && (
        <SchoolsTable schools={filtered} title="School comparison" openMenu={openMenu} onMenu={(id) => setOpenMenu(openMenu === id ? null : id)} onRemove={setRemovingSchool} />
      )}

      {removingSchool && (
        <DeleteSchoolModal
          open={!!removingSchool}
          onClose={() => setRemovingSchool(null)}
          schoolId={removingSchool.id}
          schoolName={removingSchool.name}
        />
      )}
    </div>
  );
}
