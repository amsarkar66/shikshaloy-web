"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck, UserX, Clock, TrendingUp,
  ChevronLeft, ChevronRight, ChevronDown, Download,
  CheckSquare, Users,
  Search, X, BarChart3, GraduationCap, ScanLine, Radio, Eye, Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { deptColor } from "../../staff/_data/staff";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { markStudentAttendance, markStaffAttendance, getMonthAttendanceSummary, type DayAttendanceSummary } from "../actions";
import type { AttendanceSource } from "@/lib/attendance/resolve";
import { TrendBarChart } from "./TrendBarChart";
import {
  type AttendanceStatus, STATUS, STATUS_BADGE, SOURCE_META,
  uuidAvatarColor, nameInitials, todayStr, addDays, formatLong, formatTime, downloadCsv,
} from "./attendance-shared";

export type { AttendanceStatus };
export type MarkedAttendanceStatus = Exclude<AttendanceStatus, "unmarked">;
export type StaffAttendanceStatus = "present" | "absent" | "late" | "on_leave" | "unmarked";
export type MarkedStaffAttendanceStatus = Exclude<StaffAttendanceStatus, "unmarked">;

export interface AttendanceSec {
  id:       string;
  classNum: string;
  section:  string;
  teacher:  string;
  room:     string;
  enrolled: number;
}

export interface AttendanceStudent {
  id:            string;
  name:          string;
  rollNo:        string;
  attendance:    number;
  sectionId:     string;
  classNum:      string;
  section:       string;
  checkedInAt?:  string | null;
  checkedOutAt?: string | null;
  source?:       AttendanceSource | null;
}

export interface AttendanceStaff {
  id:            string;
  name:          string;
  designation:   string;
  department:    string;
  employeeId:    string;
  type:          "teaching" | "non_teaching";
  status:        string;
  checkedInAt?:  string | null;
  checkedOutAt?: string | null;
  source?:       AttendanceSource | null;
}

const STAFF_STATUS: Record<StaffAttendanceStatus,{label:string;active:string;ghost:string}> = {
  present:  { label:"Present",    active:"bg-emerald-500 text-white border-emerald-500", ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400" },
  late:     { label:"Late",       active:"bg-amber-500   text-white border-amber-500",   ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400  hover:text-amber-600  dark:hover:text-amber-400"  },
  absent:   { label:"Absent",     active:"bg-red-500     text-white border-red-500",     ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400"    },
  on_leave: { label:"On Leave",   active:"bg-purple-500  text-white border-purple-500",  ghost:"border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500"  },
  unmarked: { label:"Not Marked", active:"bg-gray-400    text-white border-gray-400",    ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400" },
};
const STAFF_BADGE: Record<StaffAttendanceStatus,string> = {
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:    "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  on_leave:"bg-purple-500/10  text-purple-700  dark:text-purple-300  border-purple-500/20",
  unmarked:"bg-gray-500/10    text-gray-500    dark:text-zinc-400    border-gray-500/20",
};
function DateNav({ dateStr, onChange }: { dateStr: string; onChange: (d: string) => void }) {
  const isToday = dateStr===todayStr();
  const [calOpen, setCalOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>onChange(addDays(dateStr,-1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><ChevronLeft className="h-4 w-4"/></button>
      <div className="relative">
        <button onClick={()=>setCalOpen((v)=>!v)} className="flex items-center gap-2 px-4 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
          <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">{formatLong(dateStr)}</span>
          {isToday&&<span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Today</span>}
        </button>
        {calOpen && <CalendarPopover selectedDate={dateStr} onSelect={onChange} onClose={()=>setCalOpen(false)} />}
      </div>
      <button onClick={()=>onChange(addDays(dateStr,1))} disabled={isToday} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:enabled:text-gray-900 dark:hover:enabled:text-zinc-100 disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4"/></button>
    </div>
  );
}

// A calendar-month grid where each day shows a ring for the combined
// student+staff attendance rate that day, so a manager can spot low-attendance
// days at a glance while picking a date. Fetched one month at a time (and
// cached per month for the life of the popover) rather than bulk-loaded,
// since browsing arbitrary months could otherwise mean unbounded history.
function DayRing({ day, rate, active, isToday, disabled, onClick }: { day: number; rate: number | null; active: boolean; isToday: boolean; disabled: boolean; onClick: () => void }) {
  const R = 12, C = 2 * Math.PI * R;
  const dash = ((rate ?? 0) / 100) * C;
  const color = rate === null ? null : rate >= 90 ? "#10b981" : rate >= 80 ? "#f59e0b" : "#ef4444";
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`relative flex items-center justify-center rounded-lg p-1 transition-colors ${disabled?"opacity-30 cursor-not-allowed":active?"":"hover:bg-gray-100 dark:hover:bg-zinc-800"} ${active?"bg-primary-500/15 dark:bg-primary-500/25":""}`}
    >
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={R} fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-100 dark:text-zinc-700" />
        {color && dash > 0 && <circle cx="14" cy="14" r={R} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
          strokeDasharray={`${dash} ${C-dash}`} transform="rotate(-90 14 14)" />}
        <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight={isToday?700:500}
          className={isToday?"fill-primary-600 dark:fill-primary-400":"fill-gray-700 dark:fill-zinc-300"}>{day}</text>
      </svg>
    </button>
  );
}

const WEEKDAY_LABELS = ["S","M","T","W","T","F","S"];

function CalendarPopover({ selectedDate, onSelect, onClose }: { selectedDate: string; onSelect: (d: string) => void; onClose: () => void }) {
  const [selY, selM] = selectedDate.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selY);
  const [viewMonth, setViewMonth] = useState(selM - 1); // 0-indexed
  const [cache, setCache] = useState<Record<string, DayAttendanceSummary[]>>({});
  const key = `${viewYear}-${viewMonth}`;
  const monthData = cache[key];

  useEffect(() => {
    if (cache[key]) return;
    let cancelled = false;
    getMonthAttendanceSummary(viewYear, viewMonth + 1, todayStr()).then((data) => {
      if (!cancelled) setCache((c) => ({ ...c, [key]: data }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const rateByDate = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const d of monthData ?? []) m[d.date] = d.rate;
    return m;
  }, [monthData]);

  const today = todayStr();
  const now = new Date();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function goPrevMonth() { if (viewMonth===0) { setViewYear((y)=>y-1); setViewMonth(11); } else setViewMonth((m)=>m-1); }
  function goNextMonth() { if (isCurrentMonth) return; if (viewMonth===11) { setViewYear((y)=>y+1); setViewMonth(0); } else setViewMonth((m)=>m+1); }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-4 py-3">
          <button onClick={goPrevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"><ChevronLeft className="h-4 w-4"/></button>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{monthLabel}</p>
          <button onClick={goNextMonth} disabled={isCurrentMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-800 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((d,i) => (
              <div key={i} className="flex h-6 items-center justify-center text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500">{d}</div>
            ))}
          </div>
          {!monthData ? (
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => (
                <div key={i} className="flex items-center justify-center p-1">
                  {day!==null && <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100 dark:bg-zinc-800" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((day, i) => {
                if (day===null) return <div key={i} />;
                const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                return (
                  <div key={dateStr} className="flex items-center justify-center">
                    <DayRing day={day} rate={rateByDate[dateStr] ?? null} active={dateStr===selectedDate} isToday={dateStr===today}
                      disabled={dateStr > today} onClick={()=>{ onSelect(dateStr); onClose(); }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-gray-200 dark:border-zinc-800 px-4 py-2.5 text-[10px] text-gray-500 dark:text-zinc-400">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>≥90%</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"/>≥80%</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500"/>&lt;80%</span>
          <span className="ml-auto">Staff + Students</span>
        </div>
      </div>
    </>
  );
}

function StatsRow({ present, absent, late, rate }: { present: number; absent: number; late: number; rate: number }) {
  const items = [
    { label:"Present",         value:present,    icon:UserCheck,  accent:"text-emerald-500 bg-emerald-500/10" },
    { label:"Absent",          value:absent,     icon:UserX,      accent:"text-red-500     bg-red-500/10"     },
    { label:"Late",            value:late,       icon:Clock,      accent:"text-amber-500   bg-amber-500/10"   },
    { label:"Attendance Rate", value:`${rate}%`, icon:TrendingUp, accent:"text-indigo-500  bg-indigo-500/10"  },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s)=>(
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5"/></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

function StaffStatsRow({ present, absent, late, onLeave }: { present: number; absent: number; late: number; onLeave: number }) {
  const items = [
    { label:"Present",  value:present,  icon:UserCheck,  accent:"text-emerald-500 bg-emerald-500/10" },
    { label:"Absent",   value:absent,   icon:UserX,      accent:"text-red-500     bg-red-500/10"     },
    { label:"Late",     value:late,     icon:Clock,      accent:"text-amber-500   bg-amber-500/10"   },
    { label:"On Leave", value:onLeave,  icon:TrendingUp, accent:"text-purple-500  bg-purple-500/10"  },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s)=>(
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5"/></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

interface DonutSlice { key: string; label: string; value: number; color: string }

function StatusDonut({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const R = 48, cx = 64, cy = 64;
  const circ = 2 * Math.PI * R;

  if (total === 0) return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No data yet</p>;

  let offset = circ * 0.25;
  const arcs = slices.filter((s) => s.value > 0).map((s) => {
    const dash = (s.value / total) * circ;
    const a = { ...s, dash, offset };
    offset += dash;
    return a;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {arcs.map((a) => (
            <circle key={a.key} cx={cx} cy={cy} r={R} fill="none"
              stroke={a.color} strokeWidth="18"
              strokeDasharray={`${Math.max(a.dash - 2, 0)} ${circ - a.dash + 2}`}
              strokeDashoffset={-a.offset + circ * 0.25}
              strokeLinecap="round"
            />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="fill-gray-900 dark:fill-zinc-50">{total}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-gray-400 dark:fill-zinc-500">{centerLabel}</text>
        </svg>
      </div>
      <div className="grid gap-2 flex-1">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{s.label}</span>
            <span className="ml-auto text-xs font-semibold tabular-nums text-gray-800 dark:text-zinc-200">{s.value}</span>
            <span className="w-9 text-right text-[11px] tabular-nums text-gray-400 dark:text-zinc-500">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TodaysRow {
  key:              string;
  id:               string;
  type:             "staff" | "student";
  name:             string;
  idLabel:          string;
  groupLabel:       string;
  groupClass:       string;
  checkedInAt?:     string | null;
  checkedOutAt?:    string | null;
  source?:          AttendanceSource | null;
  statusLabel:      string;
  statusBadgeClass: string;
  href:             string;
}

const CLASS_CHIP = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";

function TodaysAttendanceTable({
  staff, staffStatusMap, studentsBySection, statusMap, onViewAll,
}: {
  staff: AttendanceStaff[];
  staffStatusMap: Record<string, StaffAttendanceStatus>;
  studentsBySection: Record<string, AttendanceStudent[]>;
  statusMap: Record<string, AttendanceStatus>;
  onViewAll: () => void;
}) {
  const activeStaff = useMemo(() => staff.filter((s) => s.status !== "inactive"), [staff]);
  const allStudents = useMemo(() => Object.values(studentsBySection).flat(), [studentsBySection]);

  const byRecency = (a: { checkedInAt?: string | null; name: string }, b: { checkedInAt?: string | null; name: string }) => {
    if (!a.checkedInAt && !b.checkedInAt) return a.name.localeCompare(b.name);
    if (!a.checkedInAt) return 1;
    if (!b.checkedInAt) return -1;
    return a.checkedInAt.localeCompare(b.checkedInAt);
  };

  // Reserve slots for both populations so students aren't crowded out by
  // staff whenever staff have more check-in events on file (e.g. manually
  // marked student attendance doesn't record a check-in timestamp).
  const staffRows: TodaysRow[] = useMemo(() => [...activeStaff].sort(byRecency).slice(0, 3).map((s) => {
    const status = staffStatusMap[s.id] ?? "unmarked";
    return {
      key: `staff-${s.id}`, id: s.id, type: "staff", name: s.name, idLabel: s.employeeId,
      groupLabel: s.department, groupClass: deptColor(s.department),
      checkedInAt: s.checkedInAt, checkedOutAt: s.checkedOutAt, source: s.source,
      statusLabel: STAFF_STATUS[status].label, statusBadgeClass: STAFF_BADGE[status],
      href: `/dashboard/staff/${s.id}`,
    };
  }), [activeStaff, staffStatusMap]);

  const studentRows: TodaysRow[] = useMemo(() => [...allStudents].sort(byRecency).slice(0, 3).map((st) => {
    const status = statusMap[st.id] ?? "unmarked";
    return {
      key: `student-${st.id}`, id: st.id, type: "student", name: st.name, idLabel: st.rollNo,
      groupLabel: `Class ${st.classNum}–${st.section}`, groupClass: CLASS_CHIP,
      checkedInAt: st.checkedInAt, checkedOutAt: st.checkedOutAt, source: st.source,
      statusLabel: STATUS[status].label, statusBadgeClass: STATUS_BADGE[status],
      href: `/dashboard/students/${st.id}`,
    };
  }), [allStudents, statusMap]);

  const rows = useMemo(() => [...staffRows, ...studentRows].sort(byRecency), [staffRows, studentRows]);
  const total = activeStaff.length + allStudents.length;

  return (
    <Table
      header={
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Attendance</p>
          <button onClick={onViewAll} className="ml-auto flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      }
      footer={
        total > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-700/50">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{staffRows.length} staff</span> and <span className="font-medium text-gray-700 dark:text-zinc-300">{studentRows.length} students</span> of {total} total
            </p>
          </div>
        )
      }
    >
      <TableHead>
        <Th position="first">Person</Th>
        <Th>Class / Dept.</Th>
        <Th>Check-in</Th>
        <Th>Check-out</Th>
        <Th>Source</Th>
        <Th>Status</Th>
        <Th position="last" align="right">Action</Th>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableEmptyRow colSpan={7} icon={UserCheck} message="No attendance records yet" />
        ) : rows.map((r) => {
          const punctuality = r.type === "staff" && r.statusLabel === "Late" ? "Late" : r.type === "staff" && r.statusLabel === "Present" ? "On time" : "";
          const sourceMeta = r.source ? SOURCE_META[r.source] : null;
          return (
            <Tr key={r.key}>
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(r.id)}`}>{nameInitials(r.name)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{r.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                      {r.idLabel}
                      <span className="text-gray-300 dark:text-zinc-600">·</span>
                      {r.type === "staff" ? <UserCheck className="h-2.5 w-2.5" /> : <GraduationCap className="h-2.5 w-2.5" />}
                      {r.type === "staff" ? "Staff" : "Student"}
                    </p>
                  </div>
                </div>
              </Td>
              <Td><span className={`inline-flex items-center rounded-full border border-current/20 px-2 py-0.5 text-xs font-medium whitespace-nowrap ${r.groupClass}`}>{r.groupLabel}</span></Td>
              <Td>
                <div className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatTime(r.checkedInAt)}</div>
                {punctuality && <div className={`text-xs ${punctuality==="Late"?"text-amber-600 dark:text-amber-400":"text-emerald-600 dark:text-emerald-400"}`}>{punctuality}</div>}
              </Td>
              <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatTime(r.checkedOutAt)}</Td>
              <Td>
                {sourceMeta ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    <sourceMeta.icon className="h-3 w-3" /> {sourceMeta.label}
                  </span>
                ) : <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>}
              </Td>
              <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${r.statusBadgeClass}`}>{r.statusLabel}</span></Td>
              <Td position="last" align="right">
                <Link href={r.href} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Eye className="h-3.5 w-3.5" /></Link>
              </Td>
            </Tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface TimelineEvent {
  key:      string;
  time:     string;
  title:    string;
  subtitle: string;
  badge:    "On time" | "Late" | "Pending";
  icon:     "in" | "out";
}

const TIMELINE_BADGE: Record<TimelineEvent["badge"], string> = {
  "On time": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Late":    "bg-amber-500/10   text-amber-600   dark:text-amber-400",
  "Pending": "bg-gray-500/10    text-gray-500    dark:text-zinc-400",
};

function ActivityTimeline({
  staff, staffStatusMap, studentsBySection, statusMap, onViewAll,
}: {
  staff: AttendanceStaff[];
  staffStatusMap: Record<string, StaffAttendanceStatus>;
  studentsBySection: Record<string, AttendanceStudent[]>;
  statusMap: Record<string, AttendanceStatus>;
  onViewAll: () => void;
}) {
  const activeStaff = useMemo(() => staff.filter((s) => s.status !== "inactive"), [staff]);
  const allStudents = useMemo(() => Object.values(studentsBySection).flat(), [studentsBySection]);

  const events = useMemo(() => {
    const list: TimelineEvent[] = [];
    for (const s of activeStaff) {
      const status = staffStatusMap[s.id] ?? "unmarked";
      if (s.checkedInAt) {
        list.push({
          key: `staff-${s.id}-in`, time: s.checkedInAt,
          title: status === "late" ? "Late Check-in" : "Check-in",
          subtitle: `${s.name} (${s.department})`,
          badge: status === "late" ? "Late" : "On time",
          icon: "in",
        });
      }
      if (s.checkedOutAt) {
        list.push({
          key: `staff-${s.id}-out`, time: s.checkedOutAt,
          title: "Check-out",
          subtitle: `${s.name} (${s.department})`,
          badge: "On time",
          icon: "out",
        });
      }
    }
    for (const st of allStudents) {
      const status = statusMap[st.id] ?? "unmarked";
      if (st.checkedInAt) {
        list.push({
          key: `student-${st.id}-in`, time: st.checkedInAt,
          title: status === "late" ? "Late Check-in" : "Check-in",
          subtitle: `${st.name} (Class ${st.classNum}–${st.section})`,
          badge: status === "late" ? "Late" : "On time",
          icon: "in",
        });
      }
      if (st.checkedOutAt) {
        list.push({
          key: `student-${st.id}-out`, time: st.checkedOutAt,
          title: "Check-out",
          subtitle: `${st.name} (Class ${st.classNum}–${st.section})`,
          badge: "On time",
          icon: "out",
        });
      }
    }
    return list.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3);
  }, [activeStaff, staffStatusMap, allStudents, statusMap]);

  const pendingCount = useMemo(
    () => activeStaff.filter((s) => s.checkedInAt && !s.checkedOutAt).length
        + allStudents.filter((st) => st.checkedInAt && !st.checkedOutAt).length,
    [activeStaff, allStudents],
  );

  const hasContent = events.length > 0 || pendingCount > 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Activity Timeline</p>
        {hasContent && (
          <button onClick={onViewAll} className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {!hasContent ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
          <img src="/illustrations/no-activity.png" alt="" className="h-44 w-auto rounded-lg object-cover" />
          <p className="text-sm text-gray-400 dark:text-zinc-500">No activity yet</p>
        </div>
      ) : (
        <div className="flex-1">
          {events.map((e, i) => (
            <div key={e.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${e.icon==="in"?"border-emerald-500":"border-sky-500"}`}>
                  <Check className={`h-3 w-3 ${e.icon==="in"?"text-emerald-500":"text-sky-500"}`} />
                </div>
                {(i < events.length - 1 || pendingCount > 0) && <div className="w-px flex-1 bg-gray-200 dark:bg-zinc-700 my-0.5" />}
              </div>
              <div className="flex-1 pb-4 min-w-0">
                <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 tabular-nums">{formatTime(e.time)}</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{e.subtitle}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TIMELINE_BADGE[e.badge]}`}>{e.badge}</span>
                </div>
              </div>
            </div>
          ))}
          {pendingCount > 0 && (
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 dark:border-zinc-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">—</span>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Pending Check-out</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{pendingCount} {pendingCount===1?"person":"people"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${TIMELINE_BADGE.Pending}`}>Pending</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TREND_RANGES = [7, 14, 30, 90] as const;
type TrendRange = (typeof TREND_RANGES)[number];

function OverviewTab({
  history, studentsBySection, statusMap, staff, staffStatusMap, allowStaffTab, onViewAllStaff,
}: {
  history: { date: string; rate: number | null }[];
  studentsBySection: Record<string, AttendanceStudent[]>;
  statusMap: Record<string, AttendanceStatus>;
  staff: AttendanceStaff[];
  staffStatusMap: Record<string, StaffAttendanceStatus>;
  allowStaffTab: boolean;
  onViewAllStaff: () => void;
}) {
  const [trendRange, setTrendRange] = useState<TrendRange>(30);
  const trendHistory = useMemo(() => history.slice(-trendRange), [history, trendRange]);

  const activeStaff = useMemo(() => staff.filter((s) => s.status !== "inactive"), [staff]);
  const staffSlices: DonutSlice[] = [
    { key: "present",  label: "Present",  value: activeStaff.filter((s) => staffStatusMap[s.id] === "present").length,  color: "#10b981" },
    { key: "late",     label: "Late",     value: activeStaff.filter((s) => staffStatusMap[s.id] === "late").length,     color: "#f59e0b" },
    { key: "absent",   label: "Absent",   value: activeStaff.filter((s) => staffStatusMap[s.id] === "absent").length,   color: "#ef4444" },
    { key: "on_leave", label: "On Leave", value: activeStaff.filter((s) => staffStatusMap[s.id] === "on_leave").length, color: "#a855f7" },
  ];

  const allStudents = useMemo(() => Object.values(studentsBySection).flat(), [studentsBySection]);
  const studentSlices: DonutSlice[] = [
    { key: "present", label: "Present", value: allStudents.filter((st) => statusMap[st.id] === "present").length, color: "#10b981" },
    { key: "late",    label: "Late",    value: allStudents.filter((st) => statusMap[st.id] === "late").length,    color: "#f59e0b" },
    { key: "absent",  label: "Absent",  value: allStudents.filter((st) => statusMap[st.id] === "absent").length,  color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Attendance Rate Trend</p>
          </div>
          <div className="relative shrink-0">
            <select
              value={trendRange}
              onChange={(e) => setTrendRange(Number(e.target.value) as TrendRange)}
              className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-7 text-xs font-medium text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              {TREND_RANGES.map((r) => <option key={r} value={r}>Last {r} days</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        </div>
        <TrendBarChart history={trendHistory} />
      </div>

      <div className={`grid grid-cols-1 gap-6 ${allowStaffTab ? "lg:grid-cols-2" : ""}`}>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Students Today</p>
          </div>
          <StatusDonut slices={studentSlices} centerLabel="Students" />
        </div>

        {allowStaffTab && (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <div className="mb-5 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Staff Attendance Today</p>
            </div>
            <StatusDonut slices={staffSlices} centerLabel="Staff" />
          </div>
        )}
      </div>

      {allowStaffTab && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <TodaysAttendanceTable staff={staff} staffStatusMap={staffStatusMap} studentsBySection={studentsBySection} statusMap={statusMap} onViewAll={onViewAllStaff} />
          </div>
          <ActivityTimeline staff={staff} staffStatusMap={staffStatusMap} studentsBySection={studentsBySection} statusMap={statusMap} onViewAll={onViewAllStaff} />
        </div>
      )}
    </div>
  );
}

function StudentRoster({
  studentsBySection, statusMap, onStatusChange, query, classFilter,
}: {
  studentsBySection: Record<string, AttendanceStudent[]>;
  statusMap: Record<string, AttendanceStatus>;
  onStatusChange: (id: string, sectionId: string, s: MarkedAttendanceStatus) => void;
  query: string;
  classFilter: string;
}) {
  const allStudents = useMemo(() => Object.values(studentsBySection).flat(), [studentsBySection]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allStudents.filter((st) => {
      const matchQ = !q || st.name.toLowerCase().includes(q) || st.rollNo.toLowerCase().includes(q);
      const matchC = classFilter === "all" || st.sectionId === classFilter;
      return matchQ && matchC;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allStudents, query, classFilter]);

  const counts = useMemo(() => ({
    present: filtered.filter((st) => statusMap[st.id] === "present").length,
    absent:  filtered.filter((st) => statusMap[st.id] === "absent").length,
    late:    filtered.filter((st) => statusMap[st.id] === "late").length,
  }), [filtered, statusMap]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      {filtered.length === 0 ? (
        <div className="py-16 text-center"><Users className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-zinc-400">No students match this search</p></div>
      ) : (
        <>
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((st) => {
              const status = statusMap[st.id] ?? "unmarked";
              return (
                <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(st.id)}`}>{nameInitials(st.name)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo} · Class {st.classNum}–{st.section}</p>
                  </div>
                  <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>{STATUS[status].label}</span>
                  <div className="hidden sm:flex items-center gap-1">
                    {(["present","late","absent"] as MarkedAttendanceStatus[]).map((s)=>(
                      <button key={s} onClick={()=>onStatusChange(st.id,st.sectionId,s)} className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors ${status===s?STATUS[s].active:STATUS[s].ghost}`}>{STATUS[s].label}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-700/50">
            <p className="text-xs text-gray-400 dark:text-zinc-500">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{allStudents.length}</span> students</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
              <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StaffAttendanceView({ staff, staffStatusMap, setStaffStatus }: {
  staff: AttendanceStaff[];
  staffStatusMap: Record<string, StaffAttendanceStatus>;
  setStaffStatus: (id: string, s: MarkedStaffAttendanceStatus) => void;
}) {
  const activeStaff = useMemo(()=>staff.filter((s)=>s.status!=="inactive"),[staff]);
  const departments = useMemo(()=>["all",...Array.from(new Set(activeStaff.map((s)=>s.department))).sort()],[activeStaff]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all"|"teaching"|"non_teaching">("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const markAllPresent = useCallback(()=>{
    activeStaff.filter((s)=>staffStatusMap[s.id]!=="on_leave").forEach((s)=>setStaffStatus(s.id,"present"));
  },[activeStaff,staffStatusMap,setStaffStatus]);

  const counts = useMemo(()=>({
    present: activeStaff.filter((s)=>staffStatusMap[s.id]==="present").length,
    absent:  activeStaff.filter((s)=>staffStatusMap[s.id]==="absent").length,
    late:    activeStaff.filter((s)=>staffStatusMap[s.id]==="late").length,
    onLeave: activeStaff.filter((s)=>staffStatusMap[s.id]==="on_leave").length,
  }),[activeStaff,staffStatusMap]);

  const filtered = useMemo(()=>{
    const q = query.toLowerCase();
    return activeStaff.filter((s)=>{
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q);
      const matchType = typeFilter==="all"||s.type===typeFilter;
      const matchDept = deptFilter==="all"||s.department===deptFilter;
      return matchQ&&matchType&&matchDept;
    });
  },[activeStaff,query,typeFilter,deptFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search staff or employee ID…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="flex items-center gap-1">
          {(["all","teaching","non_teaching"] as const).map((t)=>(
            <button key={t} onClick={()=>setTypeFilter(t)} className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${typeFilter===t?"bg-primary-500 text-white shadow-sm":"border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {t==="all"?"All":t==="teaching"?"Teaching":"Non-Teaching"}
            </button>
          ))}
        </div>
        <div className="relative">
          <select value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
            {departments.map((d)=><option key={d} value={d}>{d==="all"?"All Departments":d}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={markAllPresent} className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><CheckSquare className="h-3.5 w-3.5"/> Mark All Present</button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {filtered.map((st)=>{
            const status   = staffStatusMap[st.id] ?? "unmarked";
            const isLocked = status==="on_leave";
            return (
              <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(st.id)}`}>{nameInitials(st.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                    <span className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded-md ${deptColor(st.department)}`}>{st.department}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{st.designation} · {st.employeeId}</p>
                </div>
                <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STAFF_BADGE[status]}`}>{STAFF_STATUS[status].label}</span>
                <div className="hidden sm:flex items-center gap-1">
                  {(["present","late","absent"] as MarkedStaffAttendanceStatus[]).map((s)=>(
                    <button key={s} onClick={()=>!isLocked&&setStaffStatus(st.id,s)} disabled={isLocked} className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${status===s?STAFF_STATUS[s].active:STAFF_STATUS[s].ghost}`}>{STAFF_STATUS[s].label}</button>
                  ))}
                  {isLocked&&<span className={`h-7 inline-flex items-center rounded-lg border px-3 text-xs font-medium ${STAFF_STATUS.on_leave.active}`}>On Leave</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-700/50">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{activeStaff.length}</span> staff members</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{counts.onLeave} on leave</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceClient({
  initialSections,
  initialStudentsBySection,
  initialStaff,
  todayAttendance,
  todayStaffAttendance,
  attendanceHistory,
  allowStaffTab = true,
}: {
  initialSections:          AttendanceSec[];
  initialStudentsBySection: Record<string, AttendanceStudent[]>;
  initialStaff:             AttendanceStaff[];
  todayAttendance:          Record<string, AttendanceStatus>;
  todayStaffAttendance:     Record<string, StaffAttendanceStatus>;
  attendanceHistory:        { date: string; rate: number | null }[];
  allowStaffTab?:           boolean;
}) {
  const [tab,        setTab]     = useState<"overview"|"students"|"staff">("overview");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("all");
  const [dateStr,    setDate]    = useState(todayStr);

  // For today, use DB records; unmarked students stay "unmarked" until explicitly set
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const students of Object.values(initialStudentsBySection)) {
      for (const st of students) { map[st.id] = todayAttendance[st.id] ?? "unmarked"; }
    }
    return map;
  });

  const [staffStatusMap, setStaffStatusMap] = useState<Record<string, StaffAttendanceStatus>>(() => {
    const map: Record<string, StaffAttendanceStatus> = {};
    for (const s of initialStaff) { map[s.id] = todayStaffAttendance[s.id] ?? "unmarked"; }
    return map;
  });

  function handleDateChange(d: string) {
    setDate(d);
    // Reset to "unmarked" for non-today dates (no history in DB yet)
    const map: Record<string, AttendanceStatus> = {};
    for (const students of Object.values(initialStudentsBySection)) {
      for (const st of students) { map[st.id] = d===todayStr()?todayAttendance[st.id]??"unmarked":"unmarked"; }
    }
    setStatusMap(map);
    const smap: Record<string, StaffAttendanceStatus> = {};
    for (const s of initialStaff) { smap[s.id] = d===todayStr()?todayStaffAttendance[s.id]??"unmarked":"unmarked"; }
    setStaffStatusMap(smap);
  }

  function handleTabChange(t: "overview"|"students"|"staff") { setTab(t); }

  const setStudentStatus  = useCallback((id: string, secId: string, s: MarkedAttendanceStatus) => {
    setStatusMap((prev)=>({...prev,[id]:s}));
    if (dateStr === todayStr()) void markStudentAttendance(id, secId, dateStr, s);
  },[dateStr]);

  const setStaffStatusFn  = useCallback((id: string, s: MarkedStaffAttendanceStatus) => {
    setStaffStatusMap((prev)=>({...prev,[id]:s}));
    if (dateStr === todayStr()) void markStaffAttendance(id, dateStr, s);
  },[dateStr]);

  const schoolStats = useMemo(()=>{
    const all = Object.values(initialStudentsBySection).flat();
    const present = all.filter((st)=>statusMap[st.id]==="present").length;
    const absent  = all.filter((st)=>statusMap[st.id]==="absent").length;
    const late    = all.filter((st)=>statusMap[st.id]==="late").length;
    const total   = all.length;
    const rate    = total>0?Math.round(((present+late)/total)*100):0;
    return {present,absent,late,rate};
  },[initialStudentsBySection,statusMap]);

  const staffStats = useMemo(()=>{
    const active = initialStaff.filter((s)=>s.status!=="inactive");
    return {
      present: active.filter((s)=>staffStatusMap[s.id]==="present").length,
      absent:  active.filter((s)=>staffStatusMap[s.id]==="absent").length,
      late:    active.filter((s)=>staffStatusMap[s.id]==="late").length,
      onLeave: active.filter((s)=>staffStatusMap[s.id]==="on_leave").length,
    };
  },[initialStaff,staffStatusMap]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Attendance</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Daily attendance records</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <DateNav dateStr={dateStr} onChange={handleDateChange}/>
          <Link href="/dashboard/attendance/scan" className="flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 px-3 text-sm text-white transition-colors"><ScanLine className="h-3.5 w-3.5"/> Scan</Link>
          <Link href="/dashboard/attendance/devices" className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Radio className="h-3.5 w-3.5"/> Devices</Link>
          <button
            onClick={() => {
              if (tab === "staff") {
                downloadCsv(
                  `staff-attendance-${dateStr}.csv`,
                  ["Employee ID", "Name", "Department", "Designation", "Status"],
                  initialStaff.filter((s) => s.status !== "inactive").map((s) => [s.employeeId, s.name, s.department, s.designation, staffStatusMap[s.id] ?? "unmarked"])
                );
              } else {
                downloadCsv(
                  `attendance-overview-${dateStr}.csv`,
                  ["Section", "Teacher", "Total", "Present", "Absent", "Late", "Rate %"],
                  initialSections.map((sec) => {
                    const students = initialStudentsBySection[sec.id] ?? [];
                    const present = students.filter((st) => statusMap[st.id]==="present").length;
                    const absent  = students.filter((st) => statusMap[st.id]==="absent").length;
                    const late    = students.filter((st) => statusMap[st.id]==="late").length;
                    const total   = students.length;
                    const rate    = total>0 ? Math.round(((present+late)/total)*100) : 0;
                    return [`${sec.classNum}-${sec.section}`, sec.teacher, total, present, absent, late, rate];
                  })
                );
              }
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          ><Download className="h-3.5 w-3.5"/> Export</button>
        </div>
      </div>

      {tab==="staff"?<StaffStatsRow {...staffStats}/>:<StatsRow {...schoolStats}/>}

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        <button onClick={()=>handleTabChange("overview")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab==="overview"?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
          <BarChart3 className="h-4 w-4" />Overview
        </button>
        <button onClick={()=>handleTabChange("students")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab==="students"?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
          <Users className="h-4 w-4" />Students
        </button>
        {allowStaffTab && (
          <button onClick={()=>handleTabChange("staff")} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab==="staff"?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            <UserCheck className="h-4 w-4" />Staff
          </button>
        )}
      </div>

      {tab==="overview" && (
        <OverviewTab
          history={attendanceHistory}
          studentsBySection={initialStudentsBySection}
          statusMap={statusMap}
          staff={initialStaff}
          staffStatusMap={staffStatusMap}
          allowStaffTab={allowStaffTab}
          onViewAllStaff={() => handleTabChange("staff")}
        />
      )}

      {tab==="students" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input value={studentQuery} onChange={(e)=>setStudentQuery(e.target.value)} placeholder="Search student name or roll no…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="relative">
              <select value={studentClassFilter} onChange={(e)=>setStudentClassFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                <option value="all">All Classes</option>
                {initialSections.map((sec) => <option key={sec.id} value={sec.id}>Class {sec.classNum}–{sec.section}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
            {(studentQuery || studentClassFilter!=="all") && (
              <button onClick={()=>{ setStudentQuery(""); setStudentClassFilter("all"); }} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <StudentRoster studentsBySection={initialStudentsBySection} statusMap={statusMap} onStatusChange={setStudentStatus} query={studentQuery} classFilter={studentClassFilter}/>
        </div>
      )}

      {tab==="staff" && allowStaffTab && (
        <StaffAttendanceView staff={initialStaff} staffStatusMap={staffStatusMap} setStaffStatus={setStaffStatusFn}/>
      )}
    </div>
  );
}
