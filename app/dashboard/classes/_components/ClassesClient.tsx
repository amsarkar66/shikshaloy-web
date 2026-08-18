"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers, Users, BookOpen, TrendingUp,
  Search, Plus, ChevronRight, Pencil,
  GraduationCap, X, DoorOpen,
} from "lucide-react";
import { attendanceColor, attendanceBar, capacityColor } from "../_data/classes";
import { FancyButton } from "@/components/ui/fancy-button";
import { AddSectionModal, type TeacherOption } from "./AddSectionModal";
import { EditSectionModal } from "./EditSectionModal";

export interface ClassSection {
  id:             string;
  classNum:       string;
  section:        string;
  teacher:        string;
  classTeacherId: string | null;
  room:           string;
  capacity:       number;
  enrolled:       number;
  avgAttendance:  number;
  subjectCount:   number;
  status:         "active" | "inactive";
}

const ACCENTS = [
  { text: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-500/10 dark:bg-indigo-500/15",  solid: "bg-indigo-500",  ring: "hover:border-indigo-300 dark:hover:border-indigo-700"  },
  { text: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-500/10 dark:bg-violet-500/15",  solid: "bg-violet-500",  ring: "hover:border-violet-300 dark:hover:border-violet-700"  },
  { text: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-500/10 dark:bg-blue-500/15",      solid: "bg-blue-500",    ring: "hover:border-blue-300 dark:hover:border-blue-700"      },
  { text: "text-teal-600 dark:text-teal-400",      bg: "bg-teal-500/10 dark:bg-teal-500/15",      solid: "bg-teal-500",    ring: "hover:border-teal-300 dark:hover:border-teal-700"      },
  { text: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/10 dark:bg-amber-500/15",    solid: "bg-amber-500",   ring: "hover:border-amber-300 dark:hover:border-amber-700"    },
  { text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-500/10 dark:bg-rose-500/15",      solid: "bg-rose-500",    ring: "hover:border-rose-300 dark:hover:border-rose-700"      },
];

function StatsRow({ sections }: { sections: ClassSection[] }) {
  const classNums    = [...new Set(sections.map((s) => s.classNum))].sort((a, b) => +a - +b);
  const totalEnrolled = sections.reduce((s, c) => s + c.enrolled, 0);
  const totalCapacity = sections.reduce((s, c) => s + c.capacity, 0);
  const avgSize       = sections.length ? Math.round(totalEnrolled / sections.length) : 0;
  const utilPct        = totalCapacity ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const items = [
    { label: "Total Classes",     value: classNums.length,       sub: `${sections.length} section${sections.length!==1?"s":""}`, icon: GraduationCap, accent: ACCENTS[0] },
    { label: "Students Enrolled", value: totalEnrolled,           sub: `${utilPct}% of capacity`,                                  icon: Users,          accent: ACCENTS[2] },
    { label: "Avg Section Size",  value: avgSize,                 sub: "students per section",                                     icon: TrendingUp,     accent: ACCENTS[3] },
    { label: "Total Sections",    value: sections.length,         sub: "across all classes",                                       icon: Layers,         accent: ACCENTS[1] },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.accent.bg}`}><s.icon className={`h-5 w-5 ${s.accent.text}`}/></div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50 leading-tight">{s.value}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-zinc-300">{s.label}</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function nameInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function SectionCard({ sec, accent, canManage, onEdit }: { sec: ClassSection; accent: typeof ACCENTS[number]; canManage: boolean; onEdit: () => void }) {
  const capPct  = Math.round((sec.enrolled / sec.capacity) * 100);
  const capFull = sec.enrolled >= sec.capacity;
  const capNear = capPct >= 90;
  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 transition-colors group ${accent.ring}`}>
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent.solid}`}/>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.bg}`}>
            <span className={`text-sm font-bold ${accent.text}`}>{sec.classNum}<span className="text-xs">–{sec.section}</span></span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-tight">Class {sec.classNum}–{sec.section}</p>
            <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500"><DoorOpen className="h-3 w-3"/>{sec.room || "No room set"}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sec.status==="active"?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400":"bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sec.status==="active"?"bg-emerald-500":"bg-zinc-400"}`}/>
          {sec.status==="active"?"Active":"Inactive"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${accent.solid}`}>
          {sec.teacher ? nameInitials(sec.teacher) : <GraduationCap className="h-3.5 w-3.5"/>}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Class Teacher</p>
          <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{sec.teacher||"Not assigned"}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Enrolment</span>
            <span className={`text-[11px] font-semibold ${capFull?"text-red-600 dark:text-red-400":capNear?"text-amber-600 dark:text-amber-400":"text-gray-700 dark:text-zinc-300"}`}>
              {sec.enrolled} / {sec.capacity}{capFull&&<span className="ml-1 text-[9px] font-bold uppercase">Full</span>}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-1.5 rounded-full transition-all ${capacityColor(sec.enrolled, sec.capacity)}`} style={{ width: `${Math.min(100, capPct)}%` }}/>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Avg Attendance</span>
            <span className={`text-[11px] font-semibold tabular-nums ${attendanceColor(sec.avgAttendance)}`}>{sec.avgAttendance}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-1.5 rounded-full ${attendanceBar(sec.avgAttendance)}`} style={{ width: `${sec.avgAttendance}%` }}/>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400"><BookOpen className="h-3.5 w-3.5"/><span>{sec.subjectCount} subjects</span></div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canManage && (
            <button onClick={onEdit} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
          )}
          <Link href={`/dashboard/classes/${sec.id}`} className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">Roster <ChevronRight className="h-3 w-3"/></Link>
        </div>
      </div>
    </div>
  );
}

export default function ClassesClient({
  initialSections,
  teachers = [],
  canManage = true,
}: {
  initialSections: ClassSection[];
  teachers?: TeacherOption[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [query,       setQuery]      = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [modalClassNum, setModalClassNum] = useState<string | null | undefined>(undefined);
  const [editingSection, setEditingSection] = useState<ClassSection | null>(null);

  const classNums = useMemo(
    () => [...new Set(initialSections.map((s) => s.classNum))].sort((a, b) => +a - +b),
    [initialSections],
  );

  const accentFor = useMemo(() => {
    const map = new Map<string, typeof ACCENTS[number]>();
    classNums.forEach((n, i) => map.set(n, ACCENTS[i % ACCENTS.length]));
    return (classNum: string) => map.get(classNum) ?? ACCENTS[0];
  }, [classNums]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialSections.filter((s) => {
      const matchQ   = !q || `${s.classNum}-${s.section}`.toLowerCase().includes(q) || s.teacher.toLowerCase().includes(q) || s.room.toLowerCase().includes(q);
      const matchCls = classFilter === "all" || s.classNum === classFilter;
      return matchQ && matchCls;
    });
  }, [query, classFilter, initialSections]);

  const hasFilter = query || classFilter !== "all";

  const grouped = useMemo(() => {
    const map = new Map<string, ClassSection[]>();
    classNums.forEach((n) => map.set(n, []));
    filtered.forEach((s) => map.get(s.classNum)?.push(s));
    return map;
  }, [filtered, classNums]);

  const visibleClasses = classNums.filter((n) => (grouped.get(n)?.length ?? 0) > 0);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Classes</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage class sections</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {canManage && (
            <FancyButton onClick={() => setModalClassNum(null)} size="sm"><Plus className="h-4 w-4"/> Add Section</FancyButton>
          )}
        </div>
      </div>

      <StatsRow sections={initialSections}/>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by section, teacher or room…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...classNums].map((n) => (
            <button key={n} onClick={() => setClassFilter(n)} className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${classFilter===n?"bg-primary-500 text-white shadow-sm":"border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {n==="all"?"All":`Class ${n}`}
            </button>
          ))}
        </div>
        {hasFilter&&<button onClick={()=>{setQuery("");setClassFilter("all");}} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-500 -mt-2">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{initialSections.length}</span> sections{hasFilter&&<span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">· Filters active</span>}</p>
      {visibleClasses.length===0?(
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 py-20">
          <Layers className="h-8 w-8 text-gray-300 dark:text-zinc-600"/>
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{initialSections.length===0?"No classes yet":"No sections found"}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{initialSections.length===0?"Add your first section to get started":"Try adjusting your search or filters"}</p>
          {canManage && initialSections.length===0 && (
            <FancyButton onClick={() => setModalClassNum(null)} size="sm" className="mt-2"><Plus className="h-4 w-4"/> Add Section</FancyButton>
          )}
        </div>
      ):(
        <div className="space-y-8">
          {visibleClasses.map((classNum) => {
            const sections = grouped.get(classNum) ?? [];
            const accent = accentFor(classNum);
            const totalEnrolled = sections.reduce((s, c) => s + c.enrolled, 0);
            const totalCapacity = sections.reduce((s, c) => s + c.capacity, 0);
            const avgAtt = sections.length ? Math.round(sections.reduce((s, c) => s + c.avgAttendance, 0) / sections.length) : 0;
            return (
              <div key={classNum}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${accent.solid}`}><span className="text-xs font-bold text-white">{classNum}</span></div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Class {classNum}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{sections.length} section{sections.length!==1?"s":""}</span><span>·</span><span>{totalEnrolled}/{totalCapacity} students</span><span>·</span><span className={attendanceColor(avgAtt)}>{avgAtt}% avg attendance</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.map((sec) => <SectionCard key={sec.id} sec={sec} accent={accent} canManage={canManage} onEdit={() => setEditingSection(sec)}/>)}
                  {canManage && (
                    <button onClick={() => setModalClassNum(classNum)} className="rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 p-6 text-gray-400 dark:text-zinc-600 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-500 dark:hover:text-primary-500 transition-colors min-h-[220px]"><Plus className="h-6 w-6"/><span className="text-xs font-medium">Add Section</span></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {canManage && (
        <AddSectionModal
          key={modalClassNum ?? "__global__"}
          open={modalClassNum !== undefined}
          onClose={() => setModalClassNum(undefined)}
          onCreated={() => router.refresh()}
          teachers={teachers}
          lockedClassNum={modalClassNum ?? null}
        />
      )}
      {canManage && editingSection && (
        <EditSectionModal
          section={editingSection}
          teacherId={editingSection.classTeacherId}
          teachers={teachers}
          onClose={() => setEditingSection(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
