"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  UserCheck, UserX, Clock, TrendingUp,
  ChevronLeft, ChevronRight, ChevronDown, Download,
  ArrowLeft, CheckSquare, Users,
  LayoutGrid, Search, X, BarChart3, GraduationCap, ScanLine, Radio, Eye, Check,
} from "lucide-react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { deptColor } from "../../staff/_data/staff";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { markStudentAttendance, markStaffAttendance } from "../actions";

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (cell: string | number) => `"${String(cell).replace(/"/g,'""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type AttendanceStatus      = "present" | "absent" | "late" | "unmarked";
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
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function uuidAvatarColor(id: string) { const n=id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function nameInitials(name: string)  { return name.split(" ").slice(0,2).map((w)=>w[0]).join("").toUpperCase(); }

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(d: string, n: number) { const dt=new Date(d+"T00:00:00"); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; }
function formatLong(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function formatTime(iso?: string | null) { return iso ? new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}) : "—"; }

function rateColor(r: number) { if(r>=90)return"text-emerald-600 dark:text-emerald-400";if(r>=80)return"text-amber-600 dark:text-amber-400";return"text-red-600 dark:text-red-400"; }
function rateBar(r: number)   { if(r>=90)return"bg-emerald-500";if(r>=80)return"bg-amber-500";return"bg-red-500"; }

const STATUS: Record<AttendanceStatus,{label:string;active:string;ghost:string;dot:string}> = {
  present:  { label:"Present",    active:"bg-emerald-500 text-white border-emerald-500", ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400", dot:"bg-emerald-500" },
  late:     { label:"Late",       active:"bg-amber-500  text-white border-amber-500",    ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400  hover:text-amber-600  dark:hover:text-amber-400",  dot:"bg-amber-500"  },
  absent:   { label:"Absent",     active:"bg-red-500    text-white border-red-500",      ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400",    dot:"bg-red-500"    },
  unmarked: { label:"Not Marked", active:"bg-gray-400   text-white border-gray-400",     ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400", dot:"bg-gray-400"   },
};
const STATUS_BADGE: Record<AttendanceStatus,string> = {
  present:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:     "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:   "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  unmarked: "bg-gray-500/10    text-gray-500    dark:text-zinc-400    border-gray-500/20",
};
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
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>onChange(addDays(dateStr,-1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><ChevronLeft className="h-4 w-4"/></button>
      <div className="flex items-center gap-2 px-4 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">{formatLong(dateStr)}</span>
        {isToday&&<span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Today</span>}
      </div>
      <button onClick={()=>onChange(addDays(dateStr,1))} disabled={isToday} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:enabled:text-gray-900 dark:hover:enabled:text-zinc-100 disabled:opacity-30 transition-colors"><ChevronRight className="h-4 w-4"/></button>
    </div>
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

const TREND_H = 180;

function trendDateLabel(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function trendDotHex(rate: number) {
  return rate >= 90 ? "#10b981" : rate >= 80 ? "#f59e0b" : "#ef4444";
}

// Shared axis/label config for both chart variants below.
function trendTickInterval(days: number) {
  return days <= 15 ? 0 : Math.ceil(days / 12) - 1;
}

const trendChartConfig: ChartConfig = {
  rate: { label: "Attendance Rate", color: "var(--primary)" },
};

function TrendChartTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { date: string; rate: number } | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs shadow-lg">
      <p className="font-medium text-gray-900 dark:text-zinc-50">{trendDateLabel(point.date)}</p>
      <p className="text-gray-500 dark:text-zinc-400">{point.rate}% attendance</p>
    </div>
  );
}

function TrendDot(props: { cx?: number; cy?: number; payload?: { rate: number } }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  return <circle cx={cx} cy={cy} r={3} fill={trendDotHex(payload.rate)} stroke="none" />;
}

// Recharts/shadcn line chart — "no data" days are filtered out of the series
// rather than plotted, so the line runs straight through the gap between the
// two real points on either side instead of breaking there.
function TrendAreaChart({ history }: { history: { date: string; rate: number | null }[] }) {
  const data = history.filter((h): h is { date: string; rate: number } => h.rate !== null);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No attendance history yet</p>;
  }
  const tickInterval = trendTickInterval(history.length);

  return (
    <ChartContainer config={trendChartConfig} className="aspect-auto w-full" style={{ height: TREND_H }}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={trendDateLabel}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          minTickGap={0}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
          dy={6}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tickLine={false}
          axisLine={false}
          width={30}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
        />
        <Tooltip cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} content={TrendChartTooltip} />
        <Area
          type="monotone"
          dataKey="rate"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={<TrendDot />}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

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
      checkedInAt: s.checkedInAt, checkedOutAt: s.checkedOutAt,
      statusLabel: STAFF_STATUS[status].label, statusBadgeClass: STAFF_BADGE[status],
      href: `/dashboard/staff/${s.id}`,
    };
  }), [activeStaff, staffStatusMap]);

  const studentRows: TodaysRow[] = useMemo(() => [...allStudents].sort(byRecency).slice(0, 3).map((st) => {
    const status = statusMap[st.id] ?? "unmarked";
    return {
      key: `student-${st.id}`, id: st.id, type: "student", name: st.name, idLabel: st.rollNo,
      groupLabel: `Class ${st.classNum}–${st.section}`, groupClass: CLASS_CHIP,
      checkedInAt: st.checkedInAt, checkedOutAt: st.checkedOutAt,
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
        <Th>Status</Th>
        <Th position="last" align="right">Action</Th>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableEmptyRow colSpan={6} icon={UserCheck} message="No attendance records yet" />
        ) : rows.map((r) => {
          const punctuality = r.type === "staff" && r.statusLabel === "Late" ? "Late" : r.type === "staff" && r.statusLabel === "Present" ? "On time" : "";
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
  const [trendRange, setTrendRange] = useState<TrendRange>(14);
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
        <TrendAreaChart history={trendHistory} />
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

function OverviewTable({
  sections, studentsBySection, statusMap, onView,
}: {
  sections: AttendanceSec[];
  studentsBySection: Record<string, AttendanceStudent[]>;
  statusMap: Record<string, AttendanceStatus>;
  onView: (sectionId: string) => void;
}) {
  return (
    <Table>
      <TableHead>
        <Th position="first">Section</Th>
        <Th>Class Teacher</Th>
        <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total</th>
        <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</th>
        <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Absent</th>
        <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</th>
        <Th>Rate</Th>
        <Th position="last" align="right">Action</Th>
      </TableHead>
      <TableBody>
        {sections.map((sec) => {
          const students = studentsBySection[sec.id] ?? [];
          const present  = students.filter((st)=>statusMap[st.id]==="present").length;
          const absent   = students.filter((st)=>statusMap[st.id]==="absent").length;
          const late     = students.filter((st)=>statusMap[st.id]==="late").length;
          const total    = students.length;
          const rate     = total>0?Math.round(((present+late)/total)*100):0;
          return (
            <Tr key={sec.id}>
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10"><span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{sec.classNum}–{sec.section}</span></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Class {sec.classNum}–{sec.section}</span>
                </div>
              </Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-300">{sec.teacher||"—"}</Td>
              <Td className="text-center text-sm font-medium text-gray-700 dark:text-zinc-300">{sec.enrolled}</Td>
              <Td className="text-center"><span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{present}</span></Td>
              <Td className="text-center"><span className="text-sm font-semibold text-red-600 dark:text-red-400">{absent}</span></Td>
              <Td className="text-center"><span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{late}</span></Td>
              <Td>
                <div className="flex items-center gap-2 min-w-[96px]">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700"><div className={`h-1.5 rounded-full ${rateBar(rate)}`} style={{width:`${rate}%`}}/></div>
                  <span className={`text-xs font-semibold tabular-nums w-9 text-right ${rateColor(rate)}`}>{rate}%</span>
                </div>
              </Td>
              <Td position="last" align="right">
                <button onClick={()=>onView(sec.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">
                  <Users className="h-3 w-3"/> View
                </button>
              </Td>
            </Tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DetailView({
  sec, students, dateStr, statusMap, onStatusChange, onMarkAllPresent, onBack,
}: {
  sec: AttendanceSec;
  students: AttendanceStudent[];
  dateStr: string;
  statusMap: Record<string, AttendanceStatus>;
  onStatusChange: (id: string, s: MarkedAttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onBack: () => void;
}) {
  const counts = useMemo(() => ({
    present: students.filter((st)=>statusMap[st.id]==="present").length,
    absent:  students.filter((st)=>statusMap[st.id]==="absent").length,
    late:    students.filter((st)=>statusMap[st.id]==="late").length,
  }), [students, statusMap]);
  const total = students.length;
  const rate  = total>0?Math.round(((counts.present+counts.late)/total)*100):0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"><ArrowLeft className="h-4 w-4"/> All Sections</button>
        <div className="sm:ml-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500"><span className="text-[10px] font-bold text-white">{sec.classNum}{sec.section}</span></div>
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">Class {sec.classNum}–{sec.section} — {formatLong(dateStr)}</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={onMarkAllPresent} className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><CheckSquare className="h-3.5 w-3.5"/> Mark All Present</button>
          <Link href={`/dashboard/attendance/qr-sheet/${sec.id}`} target="_blank" className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><ScanLine className="h-3.5 w-3.5"/> QR Sheet</Link>
          <button
            onClick={() => downloadCsv(
              `attendance-${sec.classNum}${sec.section}-${dateStr}.csv`,
              ["Roll No", "Name", "Status"],
              students.map((st) => [st.rollNo, st.name, statusMap[st.id] ?? "unmarked"])
            )}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          ><Download className="h-3.5 w-3.5"/> Export</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:"Present",value:counts.present,color:"text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-500/10"},
          {label:"Absent", value:counts.absent,  color:"text-red-600     dark:text-red-400",     bg:"bg-red-500/10"    },
          {label:"Late",   value:counts.late,    color:"text-amber-600   dark:text-amber-400",   bg:"bg-amber-500/10"  },
          {label:"Rate",   value:`${rate}%`,     color:rateColor(rate),                           bg:"bg-indigo-500/10" },
        ].map((s)=>(
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p><p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {students.length===0?(
          <div className="py-16 text-center"><Users className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2"/><p className="text-sm text-gray-500 dark:text-zinc-400">No students in this section</p></div>
        ):(
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
              <p className="text-xs text-gray-400 dark:text-zinc-500">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{students.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{sec.enrolled}</span> enrolled students</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
                <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {students.map((st) => {
                const status = statusMap[st.id] ?? "unmarked";
                return (
                  <div key={st.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(st.id)}`}>{nameInitials(st.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                    </div>
                    <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>{STATUS[status].label}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      {(["present","late","absent"] as MarkedAttendanceStatus[]).map((s)=>(
                        <button key={s} onClick={()=>onStatusChange(st.id,s)} className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors ${status===s?STATUS[s].active:STATUS[s].ghost}`}>{STATUS[s].label}</button>
                      ))}
                    </div>
                    <span className={`hidden sm:inline text-xs font-semibold tabular-nums w-10 text-right ${st.attendance>=90?"text-emerald-600 dark:text-emerald-400":st.attendance>=75?"text-amber-600 dark:text-amber-400":"text-red-600 dark:text-red-400"}`}>{st.attendance}%</span>
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
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center"><Users className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-zinc-400">No students match this search</p></div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {filtered.map((st) => {
                const status = statusMap[st.id] ?? "unmarked";
                return (
                  <div key={st.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
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
                    <span className={`hidden sm:inline text-xs font-semibold tabular-nums w-10 text-right ${st.attendance>=90?"text-emerald-600 dark:text-emerald-400":st.attendance>=75?"text-amber-600 dark:text-amber-400":"text-red-600 dark:text-red-400"}`}>{st.attendance}%</span>
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
    </div>
  );
}

function StaffAttendanceView({ staff, dateStr, staffStatusMap, setStaffStatus }: {
  staff: AttendanceStaff[];
  dateStr: string;
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search staff or employee ID…" className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-3 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="flex items-center gap-1">
          {(["all","teaching","non_teaching"] as const).map((t)=>(
            <button key={t} onClick={()=>setTypeFilter(t)} className={`h-8 rounded-lg px-3 text-xs font-medium capitalize transition-colors ${typeFilter===t?"bg-primary-500 text-white shadow-sm":"border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {t==="all"?"All":t==="teaching"?"Teaching":"Non-Teaching"}
            </button>
          ))}
        </div>
        <div className="relative">
          <select value={deptFilter} onChange={(e)=>setDeptFilter(e.target.value)} className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-7 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
            {departments.map((d)=><option key={d} value={d}>{d==="all"?"All Departments":d}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={markAllPresent} className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><CheckSquare className="h-3.5 w-3.5"/> Mark All Present</button>
          <button
            onClick={() => downloadCsv(
              `staff-attendance-${dateStr}.csv`,
              ["Employee ID", "Name", "Department", "Designation", "Status"],
              filtered.map((st) => [st.employeeId, st.name, st.department, st.designation, staffStatusMap[st.id] ?? "unmarked"])
            )}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          ><Download className="h-3.5 w-3.5"/> Export</button>
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
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${deptColor(st.department)}`}>{st.department}</span>
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
  const [studentsView, setStudentsView] = useState<"class"|"students">("class");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("all");
  const [dateStr,    setDate]    = useState(todayStr);
  const [view,       setView]    = useState<"overview"|"detail">("overview");
  const [sectionId,  setSectionId] = useState("");

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
    if (view==="detail") setView("overview");
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

  function handleTabChange(t: "overview"|"students"|"staff") { setTab(t); setView("overview"); }
  function handleStudentsViewChange(v: "class"|"students") { setStudentsView(v); setView("overview"); }
  function openDetail(id: string) { setSectionId(id); setView("detail"); }
  function backToOverview()       { setView("overview"); }

  const setStudentStatus  = useCallback((id: string, secId: string, s: MarkedAttendanceStatus) => {
    setStatusMap((prev)=>({...prev,[id]:s}));
    if (dateStr === todayStr()) void markStudentAttendance(id, secId, dateStr, s);
  },[dateStr]);

  const setStaffStatusFn  = useCallback((id: string, s: MarkedStaffAttendanceStatus) => {
    setStaffStatusMap((prev)=>({...prev,[id]:s}));
    if (dateStr === todayStr()) void markStaffAttendance(id, dateStr, s);
  },[dateStr]);

  const markSectionAllPresent = useCallback(()=>{
    const students = initialStudentsBySection[sectionId] ?? [];
    const map: Record<string, AttendanceStatus> = {};
    students.forEach((st)=>{ map[st.id]="present"; });
    setStatusMap((prev)=>({...prev,...map}));
    if (dateStr === todayStr()) {
      students.forEach((st) => { void markStudentAttendance(st.id, sectionId, dateStr, "present"); });
    }
  },[sectionId,initialStudentsBySection,dateStr]);

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

  const activeSec = initialSections.find((s)=>s.id===sectionId);

  const filteredSections = useMemo(() => {
    const q = studentQuery.toLowerCase();
    return initialSections.filter((sec) => {
      const matchQ = !q || `${sec.classNum}${sec.section}`.toLowerCase().includes(q) || sec.teacher.toLowerCase().includes(q);
      const matchC = studentClassFilter === "all" || sec.id === studentClassFilter;
      return matchQ && matchC;
    });
  }, [initialSections, studentQuery, studentClassFilter]);

  const activeSecStudents = useMemo(() => {
    const students = initialStudentsBySection[sectionId] ?? [];
    const q = studentQuery.toLowerCase();
    if (!q) return students;
    return students.filter((st) => st.name.toLowerCase().includes(q) || st.rollNo.toLowerCase().includes(q));
  }, [initialStudentsBySection, sectionId, studentQuery]);

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
              <input value={studentQuery} onChange={(e)=>setStudentQuery(e.target.value)} placeholder={studentsView==="class"?"Search class or teacher…":"Search student name or roll no…"} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            {studentsView==="students" && (
              <div className="relative">
                <select value={studentClassFilter} onChange={(e)=>setStudentClassFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  <option value="all">All Classes</option>
                  {initialSections.map((sec) => <option key={sec.id} value={sec.id}>Class {sec.classNum}–{sec.section}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            )}
            {(studentQuery || (studentsView==="students" && studentClassFilter!=="all")) && (
              <button onClick={()=>{ setStudentQuery(""); setStudentClassFilter("all"); }} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <div className="sm:ml-auto flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit">
              {(["class","students"] as const).map((v)=>(
                <button key={v} onClick={()=>handleStudentsViewChange(v)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${studentsView===v?"bg-primary-500 text-white shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                  {v==="class"?<LayoutGrid className="h-3.5 w-3.5"/>:<Users className="h-3.5 w-3.5"/>}
                  {v==="class"?"Class":"Students"}
                </button>
              ))}
            </div>
          </div>

          {studentsView==="class"?(
            view==="overview"?(
              <OverviewTable sections={filteredSections} studentsBySection={initialStudentsBySection} statusMap={statusMap} onView={openDetail}/>
            ):activeSec?(
              <DetailView sec={activeSec} students={activeSecStudents} dateStr={dateStr} statusMap={statusMap} onStatusChange={(id,s)=>setStudentStatus(id,sectionId,s)} onMarkAllPresent={markSectionAllPresent} onBack={backToOverview}/>
            ):null
          ):(
            <StudentRoster studentsBySection={initialStudentsBySection} statusMap={statusMap} onStatusChange={setStudentStatus} query={studentQuery} classFilter={studentClassFilter}/>
          )}
        </div>
      )}

      {tab==="staff" && allowStaffTab && (
        <StaffAttendanceView staff={initialStaff} dateStr={dateStr} staffStatusMap={staffStatusMap} setStaffStatus={setStaffStatusFn}/>
      )}
    </div>
  );
}
