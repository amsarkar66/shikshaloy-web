"use client";

import { useState, useMemo, useCallback } from "react";
import {
  UserCheck, UserX, Clock, TrendingUp,
  ChevronLeft, ChevronRight, ChevronDown, Download,
  ArrowLeft, CheckSquare, Users,
} from "lucide-react";
import { deptColor } from "../../staff/_data/staff";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";
import { markStudentAttendance, markStaffAttendance } from "../actions";

export type AttendanceStatus      = "present" | "absent" | "late";
export type StaffAttendanceStatus = "present" | "absent" | "late" | "on_leave";

export interface AttendanceSec {
  id:       string;
  classNum: string;
  section:  string;
  teacher:  string;
  room:     string;
  enrolled: number;
}

export interface AttendanceStudent {
  id:         string;
  name:       string;
  rollNo:     string;
  attendance: number;
}

export interface AttendanceStaff {
  id:          string;
  name:        string;
  designation: string;
  department:  string;
  employeeId:  string;
  type:        "teaching" | "non_teaching";
  status:      string;
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function uuidAvatarColor(id: string) { const n=id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function nameInitials(name: string)  { return name.split(" ").slice(0,2).map((w)=>w[0]).join("").toUpperCase(); }

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(d: string, n: number) { const dt=new Date(d+"T00:00:00"); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; }
function formatLong(d: string) { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }

function rateColor(r: number) { if(r>=90)return"text-emerald-600 dark:text-emerald-400";if(r>=80)return"text-amber-600 dark:text-amber-400";return"text-red-600 dark:text-red-400"; }
function rateBar(r: number)   { if(r>=90)return"bg-emerald-500";if(r>=80)return"bg-amber-500";return"bg-red-500"; }

const STATUS: Record<AttendanceStatus,{label:string;active:string;ghost:string;dot:string}> = {
  present: { label:"Present", active:"bg-emerald-500 text-white border-emerald-500", ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400", dot:"bg-emerald-500" },
  late:    { label:"Late",    active:"bg-amber-500  text-white border-amber-500",    ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400  hover:text-amber-600  dark:hover:text-amber-400",  dot:"bg-amber-500"  },
  absent:  { label:"Absent",  active:"bg-red-500    text-white border-red-500",      ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400",    dot:"bg-red-500"    },
};
const STATUS_BADGE: Record<AttendanceStatus,string> = {
  present:"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:   "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};
const STAFF_STATUS: Record<StaffAttendanceStatus,{label:string;active:string;ghost:string}> = {
  present:  { label:"Present",  active:"bg-emerald-500 text-white border-emerald-500", ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400" },
  late:     { label:"Late",     active:"bg-amber-500   text-white border-amber-500",   ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-amber-400  hover:text-amber-600  dark:hover:text-amber-400"  },
  absent:   { label:"Absent",   active:"bg-red-500     text-white border-red-500",     ghost:"border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400    hover:text-red-600    dark:hover:text-red-400"    },
  on_leave: { label:"On Leave", active:"bg-purple-500  text-white border-purple-500",  ghost:"border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500"  },
};
const STAFF_BADGE: Record<StaffAttendanceStatus,string> = {
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  late:    "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  absent:  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  on_leave:"bg-purple-500/10  text-purple-700  dark:text-purple-300  border-purple-500/20",
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
        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total</th>
        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</th>
        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">Absent</th>
        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</th>
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
  onStatusChange: (id: string, s: AttendanceStatus) => void;
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
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
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
                const status = statusMap[st.id] ?? "present";
                return (
                  <div key={st.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${uuidAvatarColor(st.id)}`}>{nameInitials(st.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{st.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{st.rollNo}</p>
                    </div>
                    <span className={`sm:hidden inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}>{STATUS[status].label}</span>
                    <div className="hidden sm:flex items-center gap-1">
                      {(["present","late","absent"] as AttendanceStatus[]).map((s)=>(
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

function StaffAttendanceView({ staff, dateStr, staffStatusMap, setStaffStatus }: {
  staff: AttendanceStaff[];
  dateStr: string;
  staffStatusMap: Record<string, StaffAttendanceStatus>;
  setStaffStatus: (id: string, s: StaffAttendanceStatus) => void;
}) {
  const activeStaff = useMemo(()=>staff.filter((s)=>s.status!=="inactive"),[staff]);
  const departments = useMemo(()=>["all",...Array.from(new Set(activeStaff.map((s)=>s.department))).sort()],[activeStaff]);
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

  const filtered = useMemo(()=>activeStaff.filter((s)=>{
    const matchType = typeFilter==="all"||s.type===typeFilter;
    const matchDept = deptFilter==="all"||s.department===deptFilter;
    return matchType&&matchDept;
  }),[activeStaff,typeFilter,deptFilter]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:"Present",value:counts.present, color:"text-emerald-600 dark:text-emerald-400",bg:"bg-emerald-500/10",icon:UserCheck },
          {label:"Absent", value:counts.absent,  color:"text-red-600     dark:text-red-400",    bg:"bg-red-500/10",    icon:UserX      },
          {label:"Late",   value:counts.late,    color:"text-amber-600   dark:text-amber-400",  bg:"bg-amber-500/10",  icon:Clock      },
          {label:"On Leave",value:counts.onLeave,color:"text-purple-600  dark:text-purple-400", bg:"bg-purple-500/10", icon:TrendingUp },
        ].map((s)=>(
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-xs text-gray-400 dark:text-zinc-500">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{activeStaff.length}</span> staff members</p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{counts.present} present</span>
            <span className="text-red-600 dark:text-red-400 font-medium">{counts.absent} absent</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{counts.late} late</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{counts.onLeave} on leave</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {filtered.map((st)=>{
            const status   = staffStatusMap[st.id] ?? "present";
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
                  {(["present","late","absent"] as StaffAttendanceStatus[]).map((s)=>(
                    <button key={s} onClick={()=>!isLocked&&setStaffStatus(st.id,s)} disabled={isLocked} className={`h-7 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${status===s?STAFF_STATUS[s].active:STAFF_STATUS[s].ghost}`}>{STAFF_STATUS[s].label}</button>
                  ))}
                  {isLocked&&<span className={`h-7 inline-flex items-center rounded-lg border px-3 text-xs font-medium ${STAFF_STATUS.on_leave.active}`}>On Leave</span>}
                </div>
              </div>
            );
          })}
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
  allowStaffTab = true,
}: {
  initialSections:          AttendanceSec[];
  initialStudentsBySection: Record<string, AttendanceStudent[]>;
  initialStaff:             AttendanceStaff[];
  todayAttendance:          Record<string, AttendanceStatus>;
  todayStaffAttendance:     Record<string, StaffAttendanceStatus>;
  allowStaffTab?:           boolean;
}) {
  const [tab,        setTab]     = useState<"students"|"staff">("students");
  const [dateStr,    setDate]    = useState(todayStr);
  const [view,       setView]    = useState<"overview"|"detail">("overview");
  const [sectionId,  setSectionId] = useState("");

  // For today, use DB records; for any other date, default all to "present"
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    for (const students of Object.values(initialStudentsBySection)) {
      for (const st of students) { map[st.id] = todayAttendance[st.id] ?? "present"; }
    }
    return map;
  });

  const [staffStatusMap, setStaffStatusMap] = useState<Record<string, StaffAttendanceStatus>>(() => {
    const map: Record<string, StaffAttendanceStatus> = {};
    for (const s of initialStaff) { map[s.id] = todayStaffAttendance[s.id] ?? "present"; }
    return map;
  });

  function handleDateChange(d: string) {
    setDate(d);
    if (view==="detail") setView("overview");
    // Reset to "present" for non-today dates (no history in DB yet)
    const map: Record<string, AttendanceStatus> = {};
    for (const students of Object.values(initialStudentsBySection)) {
      for (const st of students) { map[st.id] = d===todayStr()?todayAttendance[st.id]??"present":"present"; }
    }
    setStatusMap(map);
    const smap: Record<string, StaffAttendanceStatus> = {};
    for (const s of initialStaff) { smap[s.id] = d===todayStr()?todayStaffAttendance[s.id]??"present":"present"; }
    setStaffStatusMap(smap);
  }

  function handleTabChange(t: "students"|"staff") { setTab(t); setView("overview"); }
  function openDetail(id: string) { setSectionId(id); setView("detail"); }
  function backToOverview()       { setView("overview"); }

  const setStudentStatus  = useCallback((id: string, s: AttendanceStatus) => {
    setStatusMap((prev)=>({...prev,[id]:s}));
    if (dateStr === todayStr()) void markStudentAttendance(id, sectionId, dateStr, s);
  },[dateStr, sectionId]);

  const setStaffStatusFn  = useCallback((id: string, s: StaffAttendanceStatus) => {
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

  const activeSec = initialSections.find((s)=>s.id===sectionId);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DateNav dateStr={dateStr} onChange={handleDateChange}/>
        {allowStaffTab && (
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
          {(["students","staff"] as const).map((t)=>(
            <button key={t} onClick={()=>handleTabChange(t)} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab===t?"bg-primary-500 text-white shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {t==="students"?<Users className="h-3.5 w-3.5"/>:<UserCheck className="h-3.5 w-3.5"/>}
              {t==="students"?"Students":"Staff"}
            </button>
          ))}
        </div>
        )}
        <button className="sm:ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
      </div>

      {tab==="students"&&<StatsRow {...schoolStats}/>}

      {tab==="students"?(
        view==="overview"?(
          <OverviewTable sections={initialSections} studentsBySection={initialStudentsBySection} statusMap={statusMap} onView={openDetail}/>
        ):activeSec?(
          <DetailView sec={activeSec} students={initialStudentsBySection[sectionId]??[]} dateStr={dateStr} statusMap={statusMap} onStatusChange={setStudentStatus} onMarkAllPresent={markSectionAllPresent} onBack={backToOverview}/>
        ):null
      ):(
        <StaffAttendanceView staff={initialStaff} dateStr={dateStr} staffStatusMap={staffStatusMap} setStaffStatus={setStaffStatusFn}/>
      )}
    </div>
  );
}
