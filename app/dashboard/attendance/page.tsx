"use client";

import { useState, useMemo, useCallback } from "react";
import {
  UserCheck, UserX, Clock, TrendingUp,
  ChevronLeft, ChevronRight, Download,
  ArrowLeft, CheckSquare, Users,
} from "lucide-react";
import {
  ALL_SECTIONS, getSectionDay, getSectionStudents, getStudentStatus, getSchoolDay,
  getStaffMemberStatus, ALL_STAFF,
  type AttendanceStatus, type SectionDay, type StaffAttendanceStatus, type StaffMember,
} from "./_data/attendance";
import { AVATAR_COLORS } from "../students/_data/students";
import { avatarColor as staffAvatarColor, initials as staffInitials, deptColor } from "../staff/_data/staff";
import type { Student } from "../students/_data/students";

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function initials(name: string)  { return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }

// ── Color helpers ─────────────────────────────────────────────────────────────

function rateColor(r: number) {
  if (r >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (r >= 80) return "text-amber-600   dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}
function rateBar(r: number) {
  if (r >= 90) return "bg-emerald-500";
  if (r >= 80) return "bg-amber-500";
  return "bg-red-500";
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS: Record<AttendanceStatus, { label: string; active: string; ghost: string; dot: string }> = {
  present: {
    label:  "Present",
    active: "bg-emerald-500 text-white border-emerald-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400",
    dot:    "bg-emerald-500",
  },
  late: {
    label:  "Late",
    active: "bg-amber-500 text-white border-amber-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400",
    dot:    "bg-amber-500",
  },
  absent: {
    label:  "Absent",
    active: "bg-red-500 text-white border-red-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400",
    dot:    "bg-red-500",
  },
};

const STATUS_BADGE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:    "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({
  present, absent, late, rate,
}: { present: number; absent: number; late: number; rate: number }) {
  const items = [
    { label: "Present",          value: present, icon: UserCheck,  accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Absent",           value: absent,  icon: UserX,      accent: "text-red-500     bg-red-500/10"     },
    { label: "Late",             value: late,    icon: Clock,      accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Attendance Rate",  value: `${rate}%`, icon: TrendingUp, accent: "text-indigo-500 bg-indigo-500/10" },
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

// ── Date navigator ────────────────────────────────────────────────────────────

function DateNav({
  dateStr, onChange,
}: { dateStr: string; onChange: (d: string) => void }) {
  const isToday = dateStr === todayStr();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addDays(dateStr, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 px-4 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
          {formatLong(dateStr)}
        </span>
        {isToday && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
            Today
          </span>
        )}
      </div>

      <button
        onClick={() => onChange(addDays(dateStr, 1))}
        disabled={isToday}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:enabled:text-gray-900 dark:hover:enabled:text-zinc-100 disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Overview table ────────────────────────────────────────────────────────────

function OverviewTable({
  days, dateStr, onView,
}: {
  days:    SectionDay[];
  dateStr: string;
  onView:  (sectionId: string) => void;
}) {
  const dayMap = useMemo(() => Object.fromEntries(days.map((d) => [d.sectionId, d])), [days]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Section</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Class Teacher</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Absent</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Rate</th>
              <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {ALL_SECTIONS.map((sec) => {
              const d = dayMap[sec.id];
              if (!d) return null;
              return (
                <tr
                  key={sec.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
                >
                  {/* Section */}
                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {sec.classNum}–{sec.section}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        Class {sec.classNum}–{sec.section}
                      </span>
                    </div>
                  </td>

                  {/* Teacher */}
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-zinc-300">{sec.teacher}</td>

                  {/* Total */}
                  <td className="px-3 py-3 text-center text-sm font-medium text-gray-700 dark:text-zinc-300">{sec.enrolled}</td>

                  {/* Present */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{d.present}</span>
                  </td>

                  {/* Absent */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">{d.absent}</span>
                  </td>

                  {/* Late */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{d.late}</span>
                  </td>

                  {/* Rate bar */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[96px]">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                        <div className={`h-1.5 rounded-full ${rateBar(d.rate)}`} style={{ width: `${d.rate}%` }} />
                      </div>
                      <span className={`text-xs font-semibold tabular-nums w-9 text-right ${rateColor(d.rate)}`}>
                        {d.rate}%
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 pl-3 pr-4 text-right">
                    <button
                      onClick={() => onView(sec.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Users className="h-3 w-3" /> View
                    </button>
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

// ── Detail view ───────────────────────────────────────────────────────────────

function DetailView({
  sectionId, dateStr, onBack,
}: {
  sectionId: string;
  dateStr:   string;
  onBack:    () => void;
}) {
  const sec      = ALL_SECTIONS.find((s) => s.id === sectionId)!;
  const students = useMemo(() => getSectionStudents(sectionId), [sectionId]);

  const initState = useMemo(() => {
    const map: Record<number, AttendanceStatus> = {};
    students.forEach((st) => { map[st.id] = getStudentStatus(st, dateStr); });
    return map;
  }, [students, dateStr]);

  const [statusMap, setStatusMap] = useState<Record<number, AttendanceStatus>>(initState);

  // Reset when section or date changes
  useMemo(() => { setStatusMap(initState); }, [initState]);

  const setStatus = useCallback((id: number, s: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [id]: s }));
  }, []);

  const markAllPresent = useCallback(() => {
    const all: Record<number, AttendanceStatus> = {};
    students.forEach((st) => { all[st.id] = "present"; });
    setStatusMap(all);
  }, [students]);

  const counts = useMemo(() => {
    const vals = Object.values(statusMap);
    return {
      present: vals.filter((v) => v === "present").length,
      absent:  vals.filter((v) => v === "absent").length,
      late:    vals.filter((v) => v === "late").length,
    };
  }, [statusMap]);

  const sectionDay = useMemo(() => getSectionDay(sec, dateStr), [sec, dateStr]);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Sections
        </button>

        <div className="sm:ml-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
            <span className="text-[10px] font-bold text-white">{sec.classNum}{sec.section}</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
            Class {sectionId} — {formatLong(dateStr)}
          </p>
        </div>

        <div className="sm:ml-auto flex gap-2">
          <button
            onClick={markAllPresent}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          >
            <CheckSquare className="h-3.5 w-3.5" /> Mark All Present
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Section-level stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Present",    value: sectionDay.present, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Absent",     value: sectionDay.absent,  color: "text-red-600     dark:text-red-400",     bg: "bg-red-500/10"     },
          { label: "Late",       value: sectionDay.late,    color: "text-amber-600   dark:text-amber-400",   bg: "bg-amber-500/10"   },
          { label: "Rate",       value: `${sectionDay.rate}%`, color: rateColor(sectionDay.rate), bg: "bg-indigo-500/10"  },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Student list */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {students.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No student records for this section</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{students.length}</span> of{" "}
                <span className="font-medium text-gray-700 dark:text-zinc-300">{sec.enrolled}</span> enrolled students
              </p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
                <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {students.map((st) => {
                const status = statusMap[st.id] ?? "present";
                return (
                  <div key={st.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    {/* Avatar */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(st.id)}`}>
                      {initials(st.name)}
                    </div>

                    {/* Name + roll */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                    </div>

                    {/* Current status badge (mobile) */}
                    <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>
                      {STATUS[status].label}
                    </span>

                    {/* Status toggle buttons (desktop) */}
                    <div className="hidden sm:flex items-center gap-1">
                      {(["present", "late", "absent"] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(st.id, s)}
                          className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors ${
                            status === s ? STATUS[s].active : STATUS[s].ghost
                          }`}
                        >
                          {STATUS[s].label}
                        </button>
                      ))}
                    </div>

                    {/* Overall attendance % */}
                    <span className={`hidden sm:inline text-xs font-semibold tabular-nums w-10 text-right ${
                      st.attendance >= 90 ? "text-emerald-600 dark:text-emerald-400"
                      : st.attendance >= 75 ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                    }`}>
                      {st.attendance}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Staff status config ───────────────────────────────────────────────────────

const STAFF_STATUS: Record<StaffAttendanceStatus, { label: string; active: string; ghost: string }> = {
  present:  {
    label:  "Present",
    active: "bg-emerald-500 text-white border-emerald-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400",
  },
  late: {
    label:  "Late",
    active: "bg-amber-500 text-white border-amber-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400",
  },
  absent: {
    label:  "Absent",
    active: "bg-red-500 text-white border-red-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400",
  },
  on_leave: {
    label:  "On Leave",
    active: "bg-purple-500 text-white border-purple-500",
    ghost:  "border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500",
  },
};

const STAFF_BADGE: Record<StaffAttendanceStatus, string> = {
  present:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:     "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:   "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  on_leave: "bg-purple-500/10  text-purple-700  dark:text-purple-300  border-purple-500/20",
};

// ── Staff attendance view ─────────────────────────────────────────────────────

const STAFF_TYPES = ["all", "teaching", "non_teaching"] as const;
type StaffTypeFilter = typeof STAFF_TYPES[number];

function StaffAttendanceView({ dateStr }: { dateStr: string }) {
  const activeStaff = useMemo(
    () => ALL_STAFF.filter((s) => s.status !== "inactive"),
    [],
  );

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(activeStaff.map((s) => s.department))).sort()],
    [activeStaff],
  );

  const [typeFilter, setTypeFilter] = useState<StaffTypeFilter>("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const initState = useMemo(() => {
    const map: Record<number, StaffAttendanceStatus> = {};
    activeStaff.forEach((s) => { map[s.id] = getStaffMemberStatus(s, dateStr); });
    return map;
  }, [activeStaff, dateStr]);

  const [statusMap, setStatusMap] = useState<Record<number, StaffAttendanceStatus>>(initState);
  useMemo(() => { setStatusMap(initState); }, [initState]);

  const setStatus = useCallback((id: number, s: StaffAttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [id]: s }));
  }, []);

  const markAllPresent = useCallback(() => {
    const all: Record<number, StaffAttendanceStatus> = {};
    activeStaff
      .filter((s) => s.status !== "on_leave")
      .forEach((s) => { all[s.id] = "present"; });
    setStatusMap((prev) => ({ ...prev, ...all }));
  }, [activeStaff]);

  const counts = useMemo(() => {
    const vals = Object.values(statusMap);
    return {
      present: vals.filter((v) => v === "present").length,
      absent:  vals.filter((v) => v === "absent").length,
      late:    vals.filter((v) => v === "late").length,
      onLeave: vals.filter((v) => v === "on_leave").length,
    };
  }, [statusMap]);

  const filtered = useMemo(() => activeStaff.filter((s) => {
    const matchType = typeFilter === "all" || s.type === typeFilter;
    const matchDept = deptFilter === "all" || s.department === deptFilter;
    return matchType && matchDept;
  }), [activeStaff, typeFilter, deptFilter]);

  return (
    <div className="space-y-5">
      {/* Staff stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Present",  value: counts.present, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: UserCheck  },
          { label: "Absent",   value: counts.absent,  color: "text-red-600     dark:text-red-400",     bg: "bg-red-500/10",     icon: UserX      },
          { label: "Late",     value: counts.late,    color: "text-amber-600   dark:text-amber-400",   bg: "bg-amber-500/10",   icon: Clock      },
          { label: "On Leave", value: counts.onLeave, color: "text-purple-600  dark:text-purple-400",  bg: "bg-purple-500/10",  icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + action */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Type filter pills */}
        <div className="flex items-center gap-1">
          {STAFF_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`h-8 rounded-lg px-3 text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t === "all" ? "All" : t === "teaching" ? "Teaching" : "Non-Teaching"}
            </button>
          ))}
        </div>

        {/* Department dropdown */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
          ))}
        </select>

        <div className="sm:ml-auto flex gap-2">
          <button
            onClick={markAllPresent}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
          >
            <CheckSquare className="h-3.5 w-3.5" /> Mark All Present
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Staff list */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
            <span className="font-medium text-gray-700 dark:text-zinc-300">{activeStaff.length}</span> staff members
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{counts.onLeave} on leave</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {filtered.map((st) => {
            const status   = statusMap[st.id] ?? "present";
            const isLocked = status === "on_leave";
            return (
              <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${staffAvatarColor(st.id)}`}>
                  {staffInitials(st.name)}
                </div>

                {/* Name + designation */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${deptColor(st.department)}`}>
                      {st.department}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{st.designation} · {st.employeeId}</p>
                </div>

                {/* Mobile badge */}
                <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STAFF_BADGE[status]}`}>
                  {STAFF_STATUS[status].label}
                </span>

                {/* Status toggles (desktop) */}
                <div className="hidden sm:flex items-center gap-1">
                  {(["present", "late", "absent"] as StaffAttendanceStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => !isLocked && setStatus(st.id, s)}
                      disabled={isLocked}
                      className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        status === s ? STAFF_STATUS[s].active : STAFF_STATUS[s].ghost
                      }`}
                    >
                      {STAFF_STATUS[s].label}
                    </button>
                  ))}
                  {isLocked && (
                    <span className={`h-7 inline-flex items-center rounded-lg border px-3 text-xs font-medium ${STAFF_STATUS.on_leave.active}`}>
                      On Leave
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "students" | "staff";

export default function AttendancePage() {
  const [tab,       setTab]     = useState<Tab>("students");
  const [dateStr,   setDate]    = useState(todayStr);
  const [view,      setView]    = useState<"overview" | "detail">("overview");
  const [sectionId, setSection] = useState<string>("");

  const schoolDay   = useMemo(() => getSchoolDay(dateStr), [dateStr]);
  const sectionDays = useMemo(
    () => ALL_SECTIONS.map((s) => getSectionDay(s, dateStr)),
    [dateStr],
  );

  function openDetail(id: string) { setSection(id); setView("detail"); }
  function backToOverview()       { setView("overview"); }

  function handleDateChange(d: string) {
    setDate(d);
    if (view === "detail") setView("overview");
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    setView("overview"); // always reset drill-down when switching tabs
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Date nav + tab switcher + export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DateNav dateStr={dateStr} onChange={handleDateChange} />

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
          {(["students", "staff"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t === "students" ? <Users className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
              {t === "students" ? "Students" : "Staff"}
            </button>
          ))}
        </div>

        <button className="sm:ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* Stats — only for students tab; staff view has its own stats */}
      {tab === "students" && <StatsRow {...schoolDay} />}

      {/* Content */}
      {tab === "students" ? (
        view === "overview" ? (
          <OverviewTable days={sectionDays} dateStr={dateStr} onView={openDetail} />
        ) : (
          <DetailView sectionId={sectionId} dateStr={dateStr} onBack={backToOverview} />
        )
      ) : (
        <StaffAttendanceView dateStr={dateStr} />
      )}
    </div>
  );
}
