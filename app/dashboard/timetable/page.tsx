"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, BookOpen, Users, Clock, Layers,
  Printer, ChevronDown, CalendarX,
} from "lucide-react";
import {
  DAYS, PERIODS, ROW_ITEMS, CLASS_LIST, TIMETABLES,
  SUBJECT_STYLE, DEFAULT_STYLE,
  computeStats, getTeacherSchedule, getTeacherSummaries,
  type ClassTimetable, type TeacherSummary,
} from "./_data/timetable";

type ViewMode = "class" | "teacher";

// ── Today highlight ───────────────────────────────────────────────────────────

function todayDayIndex(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? -1 : d - 1;  // Mon=0 … Sat=5, Sun=-1
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow({
  tt, viewMode, summaries,
}: {
  tt: ClassTimetable | null;
  viewMode: ViewMode;
  summaries: TeacherSummary[];
}) {
  const stats       = tt ? computeStats(tt) : null;
  const isSummary   = viewMode === "teacher" && !tt;
  const totalPeriods = summaries.reduce((s, t) => s + t.periods, 0);
  const avgPeriods   = summaries.length ? Math.round(totalPeriods / summaries.length) : 0;
  const allClasses   = new Set(summaries.flatMap((t) => t.classes)).size;
  const allSubjects  = new Set(summaries.flatMap((t) => t.subjects)).size;

  const items = isSummary
    ? [
        { label: "Teachers",    value: `${summaries.length}`, sub: "with timetable data",    icon: Users,       accent: "text-indigo-500 bg-indigo-500/10"  },
        { label: "Avg Load",    value: `${avgPeriods}`,       sub: "periods per teacher",    icon: Clock,       accent: "text-amber-500  bg-amber-500/10"   },
        { label: "Classes",     value: `${allClasses}`,       sub: "classes covered",        icon: Layers,      accent: "text-emerald-500 bg-emerald-500/10" },
        { label: "Subjects",    value: `${allSubjects}`,      sub: "subjects taught",        icon: BookOpen,    accent: "text-blue-500   bg-blue-500/10"    },
      ]
    : [
        { label: "Scheduled",   value: stats ? `${stats.scheduled}` : "—", sub: "periods this week",        icon: CalendarDays, accent: "text-indigo-500 bg-indigo-500/10"  },
        { label: viewMode === "teacher" ? "Free Periods" : "Free Slots",
                                value: stats ? `${stats.free}`       : "—", sub: viewMode === "teacher" ? "non-teaching periods" : "unscheduled periods",
                                                                                                             icon: Clock,       accent: "text-amber-500  bg-amber-500/10"   },
        { label: "Subjects",    value: stats ? `${stats.subjects}`   : "—", sub: "unique subjects",          icon: BookOpen,    accent: "text-emerald-500 bg-emerald-500/10" },
        { label: viewMode === "teacher" ? "Classes" : "Teachers",
                                value: stats ? `${stats.teachers}`   : "—", sub: viewMode === "teacher" ? "classes assigned" : "assigned teachers",
                                                                                                             icon: viewMode === "teacher" ? Layers : Users,
                                                                                                                                accent: "text-blue-500   bg-blue-500/10"    },
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
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Slot cell ─────────────────────────────────────────────────────────────────

function SlotCell({ subject, name, teacher, room }: { subject: string; name: string; teacher: string; room: string }) {
  const style = SUBJECT_STYLE[subject] ?? DEFAULT_STYLE;
  return (
    <div className={`h-full border-l-2 ${style.border} ${style.bg} rounded-r-md px-2 py-1.5`}>
      <p className={`text-[11px] font-semibold leading-tight ${style.text}`}>{name}</p>
      <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">{teacher}</p>
      <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">{room}</p>
    </div>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

function TimetableGrid({ tt }: { tt: ClassTimetable }) {
  const todayIdx = todayDayIndex();

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50">
      <table className="w-full text-sm border-collapse" style={{ minWidth: 780 }}>
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            <th className="w-16 py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 whitespace-nowrap">
              Period
            </th>
            <th className="w-20 py-3 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 whitespace-nowrap">
              Time
            </th>
            {DAYS.map((day, i) => (
              <th
                key={day}
                className={`py-3 px-2 text-center text-xs font-semibold tracking-wide transition-colors ${
                  i === todayIdx
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-zinc-300"
                }`}
              >
                <span className={`inline-flex items-center gap-1 ${i === todayIdx ? "relative" : ""}`}>
                  {day}
                  {i === todayIdx && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_ITEMS.map((row, ri) => {
            if (row.type === "break") {
              return (
                <tr key={`break-${ri}`} className="bg-gray-50/70 dark:bg-zinc-800/40">
                  <td colSpan={8} className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        {row.label}
                      </span>
                      <span className="text-[10px] text-gray-300 dark:text-zinc-600">{row.time}</span>
                    </div>
                  </td>
                </tr>
              );
            }

            const p = row.period;
            return (
              <tr key={p.num} className="border-t border-gray-100 dark:border-zinc-700/50">
                <td className="py-2 px-3 align-top">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 text-xs font-bold text-gray-600 dark:text-zinc-300">
                    {p.num}
                  </span>
                </td>
                <td className="py-2 px-2 align-top whitespace-nowrap">
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">{p.start}</p>
                  <p className="text-[10px] text-gray-300 dark:text-zinc-600 leading-tight">{p.end}</p>
                </td>
                {DAYS.map((day, di) => {
                  const slot = tt[day]?.[p.num];
                  return (
                    <td
                      key={day}
                      className={`py-1.5 px-1.5 align-top ${
                        di === todayIdx ? "bg-indigo-50/40 dark:bg-indigo-500/5" : ""
                      }`}
                      style={{ minWidth: 110 }}
                    >
                      {slot ? (
                        <SlotCell {...slot} />
                      ) : (
                        <div className="h-full min-h-[52px] rounded-md border border-dashed border-gray-200 dark:border-zinc-700/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 py-24">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800">
        <CalendarX className="h-6 w-6 text-gray-400 dark:text-zinc-500" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
          Timetable not configured
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          No schedule has been set up for <span className="font-medium">{label}</span> yet.
        </p>
      </div>
      <button className="mt-1 flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm">
        <Layers className="h-3.5 w-3.5" /> Configure Timetable
      </button>
    </div>
  );
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500",   "bg-amber-500",  "bg-teal-500", "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];
function avatarColor(name: string) {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function TeacherSummaryTable({
  summaries, onSelect,
}: {
  summaries: TeacherSummary[];
  onSelect: (teacher: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Teacher
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Subjects
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Classes
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Periods / wk
              </th>
              <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                Schedule
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {summaries.map((t) => (
              <tr
                key={t.teacher}
                onClick={() => onSelect(t.teacher)}
                className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors cursor-pointer"
              >
                {/* Teacher */}
                <td className="py-3 pl-4 pr-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(t.teacher)}`}>
                      {initials(t.teacher)}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-zinc-100">{t.teacher}</p>
                  </div>
                </td>

                {/* Subjects */}
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.subjects.slice(0, 2).map((s) => (
                      <span key={s} className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                        {s}
                      </span>
                    ))}
                    {t.subjects.length > 2 && (
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                        +{t.subjects.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                {/* Classes */}
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.classes.slice(0, 4).map((c) => (
                      <span key={c} className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:text-zinc-300">
                        {c}
                      </span>
                    ))}
                    {t.classes.length > 4 && (
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                        +{t.classes.length - 4}
                      </span>
                    )}
                  </div>
                </td>

                {/* Periods */}
                <td className="px-3 py-3">
                  <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-3 py-1 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    {t.periods}
                  </span>
                </td>

                {/* Action */}
                <td className="py-3 pl-3 pr-4 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(t.teacher); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors"
                  >
                    View Schedule
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [view,       setView]    = useState<ViewMode>("class");
  const [selClass,   setClass]   = useState(CLASS_LIST[0]);
  const [selTeacher, setTeacher] = useState<string>("");

  const summaries = useMemo(() => getTeacherSummaries(), []);

  function handleViewChange(v: ViewMode) {
    setView(v);
    if (v === "teacher") setTeacher(""); // always land on the summary list
  }

  const activeTt: ClassTimetable | null = useMemo(() => {
    if (view === "class") return TIMETABLES[selClass] ?? null;
    if (!selTeacher) return null;
    return getTeacherSchedule(selTeacher);
  }, [view, selClass, selTeacher]);

  const configuredCount = Object.keys(TIMETABLES).length;
  const label = view === "class" ? `Class ${selClass}` : selTeacher || "—";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Stats */}
      <StatsRow tt={activeTt} viewMode={view} summaries={summaries} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shrink-0">
          {(["class", "teacher"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => handleViewChange(v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {v === "class" ? <Layers className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
              By {v === "class" ? "Class" : "Teacher"}
            </button>
          ))}
        </div>

        {/* Selector */}
        {view === "class" ? (
          <div className="relative">
            <select
              value={selClass}
              onChange={(e) => setClass(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm font-medium text-gray-800 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              {CLASS_LIST.map((c) => (
                <option key={c} value={c}>
                  Class {c}{!TIMETABLES[c] ? "  (not configured)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        ) : selTeacher ? (
          /* Quick-switch dropdown — only shown once a teacher is already selected */
          <div className="relative">
            <select
              value={selTeacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm font-medium text-gray-800 dark:text-zinc-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              {summaries.map((t) => (
                <option key={t.teacher} value={t.teacher}>{t.teacher}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        ) : null}

        {/* Meta info */}
        <div className="text-xs text-gray-400 dark:text-zinc-500 sm:ml-1">
          {configuredCount} of {CLASS_LIST.length} classes configured
        </div>

        {/* Actions */}
        <div className="sm:ml-auto flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm">
            <Layers className="h-3.5 w-3.5" /> Edit Timetable
          </button>
        </div>
      </div>

      {/* Title strip */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-indigo-500" />
        <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
          {view === "teacher" && !selTeacher
            ? "All Teachers — Weekly Load Overview"
            : `${label} — Weekly Schedule`}
        </p>
        {view === "teacher" && selTeacher && (
          <button
            onClick={() => setTeacher("")}
            className="ml-2 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            ← All Teachers
          </button>
        )}
      </div>

      {/* Summary list / grid / empty state */}
      {view === "teacher" && !selTeacher ? (
        <TeacherSummaryTable summaries={summaries} onSelect={setTeacher} />
      ) : activeTt ? (
        <TimetableGrid tt={activeTt} />
      ) : (
        <EmptyState label={label} />
      )}

      {/* Legend */}
      {activeTt && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(SUBJECT_STYLE).map(([code, style]) => (
            <span
              key={code}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full border ${style.border} bg-current`} />
              {code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
