"use client";

import { useState, useMemo } from "react";
import {
  Layers, Users, BookOpen, TrendingUp,
  Search, Plus, ChevronRight, Pencil,
  GraduationCap, X,
} from "lucide-react";
import {
  ALL_SECTIONS, CLASS_NUMBERS,
  attendanceColor, attendanceBar, capacityColor,
  type ClassSection,
} from "./_data/classes";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const totalSections = ALL_SECTIONS.length;
  const totalClasses  = CLASS_NUMBERS.length;
  const totalEnrolled = ALL_SECTIONS.reduce((s, c) => s + c.enrolled, 0);
  const avgSize       = Math.round(totalEnrolled / totalSections);

  const items = [
    { label: "Total Classes",   value: totalClasses,  icon: GraduationCap, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Total Sections",  value: totalSections, icon: Layers,        accent: "text-violet-500  bg-violet-500/10"  },
    { label: "Students Enrolled",value: totalEnrolled, icon: Users,         accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Avg Section Size", value: avgSize,       icon: TrendingUp,    accent: "text-emerald-500 bg-emerald-500/10" },
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

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ sec }: { sec: ClassSection }) {
  const capPct     = Math.round((sec.enrolled / sec.capacity) * 100);
  const capFull    = sec.enrolled >= sec.capacity;
  const capNear    = capPct >= 90;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {sec.classNum}<span className="text-xs">–{sec.section}</span>
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-tight">
              Class {sec.classNum}–{sec.section}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{sec.room}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          sec.status === "active"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
        }`}>
          {sec.status === "active" ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Teacher */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700">
          <GraduationCap className="h-3 w-3 text-gray-500 dark:text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Class Teacher</p>
          <p className="text-xs font-medium text-gray-700 dark:text-zinc-300 truncate">{sec.teacher}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2.5">
        {/* Capacity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Enrolment</span>
            <span className={`text-[11px] font-semibold ${
              capFull ? "text-red-600 dark:text-red-400" : capNear ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-zinc-300"
            }`}>
              {sec.enrolled} / {sec.capacity}
              {capFull && <span className="ml-1 text-[9px] font-bold uppercase">Full</span>}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700">
            <div
              className={`h-1.5 rounded-full transition-all ${capacityColor(sec.enrolled, sec.capacity)}`}
              style={{ width: `${Math.min(100, capPct)}%` }}
            />
          </div>
        </div>

        {/* Attendance */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Avg Attendance</span>
            <span className={`text-[11px] font-semibold tabular-nums ${attendanceColor(sec.avgAttendance)}`}>
              {sec.avgAttendance}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700">
            <div
              className={`h-1.5 rounded-full ${attendanceBar(sec.avgAttendance)}`}
              style={{ width: `${sec.avgAttendance}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{sec.subjectCount} subjects</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
            Roster <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const [query,       setQuery]     = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_SECTIONS.filter((s) => {
      const matchQ   = !q || s.id.toLowerCase().includes(q) || s.teacher.toLowerCase().includes(q) || s.room.toLowerCase().includes(q);
      const matchCls = classFilter === "all" || s.classNum === classFilter;
      return matchQ && matchCls;
    });
  }, [query, classFilter]);

  const hasFilter = query || classFilter !== "all";

  // Group filtered sections by class number
  const grouped = useMemo(() => {
    const map = new Map<string, ClassSection[]>();
    CLASS_NUMBERS.forEach((n) => map.set(n, []));
    filtered.forEach((s) => map.get(s.classNum)?.push(s));
    return map;
  }, [filtered]);

  const visibleClasses = CLASS_NUMBERS.filter((n) => (grouped.get(n)?.length ?? 0) > 0);

  return (
    <div className="w-full px-6 py-6 space-y-6">

      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Search by section, teacher or room…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Class filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {["all", ...CLASS_NUMBERS].map((n) => (
            <button
              key={n}
              onClick={() => setClassFilter(n)}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                classFilter === n
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {n === "all" ? "All" : `Class ${n}`}
            </button>
          ))}
        </div>

        {hasFilter && (
          <button
            onClick={() => { setQuery(""); setClassFilter("all"); }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm sm:ml-auto shrink-0">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500 dark:text-zinc-500 -mt-2">
        Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_SECTIONS.length}</span> sections
        {hasFilter && <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">· Filters active</span>}
      </p>

      {/* Grouped sections */}
      {visibleClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 py-20">
          <Layers className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No sections found</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleClasses.map((classNum) => {
            const sections = grouped.get(classNum) ?? [];
            const totalEnrolled = sections.reduce((s, c) => s + c.enrolled, 0);
            const totalCapacity = sections.reduce((s, c) => s + c.capacity, 0);
            const avgAtt = sections.length
              ? Math.round(sections.reduce((s, c) => s + c.avgAttendance, 0) / sections.length)
              : 0;

            return (
              <div key={classNum}>
                {/* Class group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shadow-sm shadow-indigo-500/30">
                      <span className="text-xs font-bold text-white">{classNum}</span>
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Class {classNum}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{sections.length} section{sections.length !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span>{totalEnrolled}/{totalCapacity} students</span>
                    <span>·</span>
                    <span className={attendanceColor(avgAtt)}>{avgAtt}% avg attendance</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
                </div>

                {/* Section cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sections.map((sec) => (
                    <SectionCard key={sec.id} sec={sec} />
                  ))}
                  {/* Add section card */}
                  <button className="rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 p-6 text-gray-400 dark:text-zinc-600 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 dark:hover:text-indigo-500 transition-colors min-h-[220px]">
                    <Plus className="h-6 w-6" />
                    <span className="text-xs font-medium">Add Section</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
