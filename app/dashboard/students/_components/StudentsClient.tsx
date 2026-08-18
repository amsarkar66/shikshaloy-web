"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, UserX, UserPlus, AlertCircle,
  Search, Plus, Download, ChevronLeft, ChevronRight, ChevronDown,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Phone, CreditCard,
  X, GraduationCap, Upload, Loader2, CheckCircle2, SlidersHorizontal, KeyRound,
  LayoutGrid, List, Calendar,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BulkImportModal, type ImportColumn } from "../../_components/bulk-import-modal";
import { AddStudentModal, type SectionOption } from "./add-student-modal";
import { StudentCredentialsDialog } from "./credentials-dialog";
import { bulkImportStudents, setStudentActive, type BulkImportOutcome } from "../actions";
import { PlanLimitModal } from "../../_components/plan-limit-modal";

export type FeeStatus = "paid" | "partial" | "overdue";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  parent: string;
  phone: string;
  attendance: number;
  feeStatus: FeeStatus;
  active: boolean;
  status: "active" | "inactive" | "graduated";
  gender: "Male" | "Female" | "Other" | null;
  joinedDate: string | null;
  photoUrl: string | null;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

type SortField = "name" | "class" | "attendance" | "feeStatus" | "joinedDate";
type SortDir   = "asc" | "desc";

const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

function attendanceColor(pct: number) {
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function attendanceBar(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const PAGE_SIZE = 10;
const CLASSES  = ["5", "6", "7", "8", "9", "10"];

const IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name",    label: "Name",     required: true },
  { key: "rollNo",  label: "Roll No",  required: true },
  { key: "class",   label: "Class",    required: true },
  { key: "section", label: "Section" },
  { key: "parent",  label: "Parent" },
  { key: "phone",   label: "Phone" },
];

function StatsRow({ students }: { students: Student[] }) {
  const total    = students.length;
  const active   = students.filter((s) => s.active).length;
  const overdue  = students.filter((s) => s.feeStatus === "overdue").length;
  const nowMonth = new Date().toISOString().slice(0, 7);
  const newCount = students.filter((s) => s.joinedDate?.startsWith(nowMonth)).length;

  const items = [
    { label: "Total Students",      value: total,    icon: Users,       accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",              value: active,   icon: UserCheck,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Enrolled This Month", value: newCount, icon: UserPlus,    accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Fee Overdue",         value: overdue,  icon: AlertCircle, accent: "text-red-500     bg-red-500/10"     },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function RowActionsMenu({
  student, open, onToggle, onClose, onChanged, onViewCredentials,
}: {
  student: Student;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChanged: () => void;
  onViewCredentials: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    onToggle();
  }

  async function handleToggleActive() {
    setBusy(true);
    setError(null);
    try {
      await setStudentActive(student.id, !student.active);
      onClose();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const menuItemClass = "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors";

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/students/${student.id}`}
        title="View student"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
          >
            {error && <p className="px-3.5 py-1.5 text-[11px] text-red-500">{error}</p>}
            <Link href={`/dashboard/students/${student.id}/edit`} onClick={onClose} className={menuItemClass}>
              <Pencil className="h-3.5 w-3.5 shrink-0" /> Edit Student
            </Link>
            <a href={`tel:${student.phone}`} className={menuItemClass}>
              <Phone className="h-3.5 w-3.5 shrink-0" /> Call Parent
            </a>
            <Link href="/dashboard/id-cards" onClick={onClose} className={menuItemClass}>
              <CreditCard className="h-3.5 w-3.5 shrink-0" /> Generate ID Card
            </Link>
            <button onClick={() => { onClose(); onViewCredentials(); }} className={`w-full ${menuItemClass}`}>
              <KeyRound className="h-3.5 w-3.5 shrink-0" /> Login Credentials
            </button>
            <div className="my-1 border-t border-gray-100 dark:border-zinc-700/50" />
            <button
              disabled={busy}
              onClick={handleToggleActive}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium disabled:opacity-50 transition-colors ${
                student.active
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              }`}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : student.active ? (
                <UserX className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <UserCheck className="h-3.5 w-3.5 shrink-0" />
              )}
              {student.active ? "Deactivate Student" : "Activate Student"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StudentCard({
  student: s, open, onToggle, onClose, onChanged, onViewCredentials,
}: {
  student: Student;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChanged: () => void;
  onViewCredentials: () => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-gray-300 dark:hover:border-zinc-600">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {s.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoUrl} alt={s.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800" />
          ) : (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white dark:ring-zinc-800 ${avatarColor(s.id)}`}>
              {initials(s.name)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-800 ${s.active ? "bg-emerald-500" : "bg-gray-300 dark:bg-zinc-600"}`}
            title={s.active ? "Active" : "Inactive"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/students/${s.id}`} className="block font-semibold text-gray-900 dark:text-zinc-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {s.name}
          </Link>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center rounded-md bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:text-primary-300">
              {s.class}–{s.section}
            </span>
            {s.status === "graduated" && (
              <span className="inline-flex items-center rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">Graduated</span>
            )}
            {s.status === "inactive" && (
              <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-zinc-400">Inactive</span>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <RowActionsMenu
            student={s}
            open={open}
            onToggle={onToggle}
            onClose={onClose}
            onChanged={onChanged}
            onViewCredentials={onViewCredentials}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 dark:text-zinc-500">Attendance</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className={`h-1.5 rounded-full ${attendanceBar(s.attendance)}`} style={{ width: `${s.attendance}%` }} />
            </div>
            <span className={`font-semibold tabular-nums ${attendanceColor(s.attendance)}`}>{s.attendance}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 dark:text-zinc-500">Fee Status</span>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>
            {s.feeStatus}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined</span>
          <span className="text-gray-600 dark:text-zinc-300">{formatDate(s.joinedDate)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-700/50 pt-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-700 dark:text-zinc-300">{s.parent}</p>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">{s.gender ?? "—"}</p>
        </div>
        <a
          href={`tel:${s.phone}`}
          title="Call Parent"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function StudentsClient({
  students: initialStudents, sections, atStudentCapacity, maxStudents,
}: {
  students: Student[];
  sections: SectionOption[];
  atStudentCapacity?: boolean;
  maxStudents?: number | null;
}) {
  const router = useRouter();
  const [students,    setStudents]  = useState(initialStudents);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [viewMode,    setViewMode]  = useState<"table" | "grid">("table");
  const [query,       setQuery]     = useState("");
  const [classFilter,  setClass]    = useState("all");
  const [sectionFilter, setSection] = useState("all");
  const [genderFilter, setGender]   = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [feeFilter,   setFee]       = useState("all");
  const [attendanceFilter, setAttendance] = useState("all");
  const [enrolledFilter,   setEnrolled]   = useState("all");
  const [filterOpen,  setFilterOpen] = useState(false);
  const [sortField,   setSortField] = useState<SortField>("name");
  const [sortDir,     setSortDir]   = useState<SortDir>("asc");
  const [page,        setPage]      = useState(1);
  const [importOpen,  setImportOpen] = useState(false);
  const [addOpen,     setAddOpen]    = useState(false);
  const [importBusy,  setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportOutcome | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [credentialsStudent, setCredentialsStudent] = useState<Student | null>(null);

  useEffect(() => { setStudents(initialStudents); }, [initialStudents]);

  async function handleImport(rows: Record<string, string>[]) {
    setImportBusy(true);
    setImportResult(null);
    try {
      const outcome = await bulkImportStudents(
        rows.map((r) => ({
          name: r.name, rollNo: r.rollNo, class: r.class,
          section: r.section, parent: r.parent, phone: r.phone,
        }))
      );
      setImportResult(outcome);
      router.refresh();
    } finally {
      setImportBusy(false);
    }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const sectionOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.section).filter(Boolean))).sort(),
    [students]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear  = now.toISOString().slice(0, 4);
    return students.filter((s) => {
      const matchQ    = !q || s.name.toLowerCase().includes(q) || s.rollNo.includes(q) || s.parent.toLowerCase().includes(q);
      const matchCls  = classFilter   === "all" || s.class === classFilter;
      const matchSec  = sectionFilter === "all" || s.section === sectionFilter;
      const matchGen  = genderFilter  === "all" || s.gender === genderFilter;
      const matchStat = statusFilter  === "all" || s.status === statusFilter;
      const matchFee  = feeFilter     === "all" || s.feeStatus === feeFilter;
      const matchAtt  =
        attendanceFilter === "all" ? true :
        attendanceFilter === "below75" ? s.attendance < 75 :
        attendanceFilter === "75to90"  ? s.attendance >= 75 && s.attendance <= 90 :
        s.attendance > 90;
      const matchEnrolled =
        enrolledFilter === "all" ? true :
        enrolledFilter === "thisMonth" ? Boolean(s.joinedDate?.startsWith(thisMonth)) :
        Boolean(s.joinedDate?.startsWith(thisYear));
      return matchQ && matchCls && matchSec && matchGen && matchStat && matchFee && matchAtt && matchEnrolled;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")       cmp = a.name.localeCompare(b.name);
      if (sortField === "class")      cmp = Number(a.class) - Number(b.class) || a.section.localeCompare(b.section);
      if (sortField === "attendance") cmp = a.attendance - b.attendance;
      if (sortField === "feeStatus")  cmp = a.feeStatus.localeCompare(b.feeStatus);
      if (sortField === "joinedDate") cmp = (a.joinedDate ?? "").localeCompare(b.joinedDate ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, classFilter, sectionFilter, genderFilter, statusFilter, feeFilter, attendanceFilter, enrolledFilter, sortField, sortDir, students]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setQuery("");
    setClass("all"); setSection("all"); setGender("all"); setStatus("all"); setFee("all");
    setAttendance("all"); setEnrolled("all");
    setPage(1);
  }
  const activeFilterCount = [classFilter, sectionFilter, genderFilter, statusFilter, feeFilter, attendanceFilter, enrolledFilter].filter((v) => v !== "all").length;
  const hasFilter = Boolean(query) || activeFilterCount > 0;

  const paginationContent = (
    <>
      <p className="text-xs text-gray-500 dark:text-zinc-400">
        Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> students
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
          .reduce<(number | "…")[]>((acc, n, i, arr) => {
            if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(n); return acc;
          }, [])
          .map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
            ) : (
              <button key={n} onClick={() => setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>
                {n}
              </button>
            )
          )}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Students</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage student records</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <Download className="h-3.5 w-3.5" /> Export
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={importBusy}
                onClick={() => (atStudentCapacity ? setShowLimitModal(true) : setImportOpen(true))}
              >
                {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" render={<Link href="/dashboard/students/promote" />}>
                <GraduationCap className="h-3.5 w-3.5" /> Promote Students
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <FancyButton onClick={() => (atStudentCapacity ? setShowLimitModal(true) : setAddOpen(true))} size="sm">
            <Plus className="h-4 w-4" /> Add Student
          </FancyButton>
        </div>
      </div>

      <StatsRow students={students} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, roll no or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex h-9 items-center gap-0.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
          <button
            onClick={() => setViewMode("table")}
            title="Table view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            title="Grid view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
                : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 space-y-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-lg shadow-black/10">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class</label>
                    <div className="relative">
                      <select
                        value={classFilter}
                        onChange={(e) => { setClass(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All</option>
                        {CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Section</label>
                    <div className="relative">
                      <select
                        value={sectionFilter}
                        onChange={(e) => { setSection(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All</option>
                        {sectionOptions.map((sec) => <option key={sec} value={sec}>Section {sec}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Gender</label>
                  <div className="relative">
                    <select
                      value={genderFilter}
                      onChange={(e) => { setGender(e.target.value); setPage(1); }}
                      className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="graduated">Graduated</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Fee Status</label>
                    <div className="relative">
                      <select
                        value={feeFilter}
                        onChange={(e) => { setFee(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Attendance</label>
                    <div className="relative">
                      <select
                        value={attendanceFilter}
                        onChange={(e) => { setAttendance(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All</option>
                        <option value="below75">Below 75%</option>
                        <option value="75to90">75–90%</option>
                        <option value="above90">Above 90%</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Enrolled</label>
                    <div className="relative">
                      <select
                        value={enrolledFilter}
                        onChange={(e) => { setEnrolled(e.target.value); setPage(1); }}
                        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      >
                        <option value="all">All time</option>
                        <option value="thisMonth">This month</option>
                        <option value="thisYear">This year</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setClass("all"); setSection("all"); setGender("all"); setStatus("all"); setFee("all");
                      setAttendance("all"); setEnrolled("all");
                      setPage(1);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear all filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <PlanLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resource="students"
        limit={maxStudents ?? null}
      />

      {importResult && (
        <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <div>
            <p className="text-gray-700 dark:text-zinc-300">
              Imported {importResult.succeeded} student{importResult.succeeded === 1 ? "" : "s"}
              {importResult.failed.length > 0 && `, ${importResult.failed.length} failed`}.
            </p>
            {importResult.failed.length > 0 && (
              <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {importResult.failed.map((f, i) => <li key={i}>{f.row}: {f.reason}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        sections={sections}
        onCreated={() => router.refresh()}
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Students"
        columns={IMPORT_COLUMNS}
        onImport={handleImport}
      />

      {credentialsStudent && (
        <StudentCredentialsDialog
          studentId={credentialsStudent.id}
          studentName={credentialsStudent.name}
          onClose={() => setCredentialsStudent(null)}
        />
      )}

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      {viewMode === "table" && (
      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            {paginationContent}
          </div>
        )}
      >
        <TableHead>
          <Th position="first">
            <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Student <SortIcon field="name" active={sortField === "name"} dir={sortDir} />
            </button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("class")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Class <SortIcon field="class" active={sortField === "class"} dir={sortDir} />
            </button>
          </Th>
          <Th>Gender</Th>
          <Th>Parent / Guardian</Th>
          <Th>
            <button onClick={() => toggleSort("attendance")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Attendance <SortIcon field="attendance" active={sortField === "attendance"} dir={sortDir} />
            </button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("feeStatus")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Fee Status <SortIcon field="feeStatus" active={sortField === "feeStatus"} dir={sortDir} />
            </button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("joinedDate")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Joined <SortIcon field="joinedDate" active={sortField === "joinedDate"} dir={sortDir} />
            </button>
          </Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-20 text-center">
                <div className="flex flex-col items-center gap-2">
                  <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                </div>
              </td>
            </tr>
          ) : (
            pageData.map((s) => (
              <Tr key={s.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    {s.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photoUrl} alt={s.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>
                        {initials(s.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
                    </div>
                    {s.status === "graduated" && (
                      <span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">Graduated</span>
                    )}
                    {s.status === "inactive" && (
                      <span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">Inactive</span>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {s.class}–{s.section}
                  </span>
                </Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300">{s.gender ?? "—"}</Td>
                <Td>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[160px]">{s.parent}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p>
                </Td>
                <Td>
                  <div className="flex items-center gap-2 min-w-[96px]">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                      <div className={`h-1.5 rounded-full ${attendanceBar(s.attendance)}`} style={{ width: `${s.attendance}%` }} />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${attendanceColor(s.attendance)}`}>{s.attendance}%</span>
                  </div>
                </Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>
                    {s.feeStatus}
                  </span>
                </Td>
                <Td className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(s.joinedDate)}</Td>
                <Td position="last">
                  <RowActionsMenu
                    student={s}
                    open={openMenuId === s.id}
                    onToggle={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    onClose={() => setOpenMenuId(null)}
                    onChanged={() => router.refresh()}
                    onViewCredentials={() => setCredentialsStudent(s)}
                  />
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageData.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
              <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            pageData.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                open={openMenuId === s.id}
                onToggle={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                onClose={() => setOpenMenuId(null)}
                onChanged={() => router.refresh()}
                onViewCredentials={() => setCredentialsStudent(s)}
              />
            ))
          )}
        </div>
      )}

      {viewMode === "grid" && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
          {paginationContent}
        </div>
      )}
    </div>
  );
}
