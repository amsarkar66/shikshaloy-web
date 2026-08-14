"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AttendanceBucket {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  unmarked: number;
}

export interface DailyPoint {
  date: string;
  pct: number;
}

const RANGE_LABELS = { day: "Day", week: "Week", month: "Month" } as const;
type Range = keyof typeof RANGE_LABELS;

const POPULATION_LABELS = { student: "Students", staff: "Staff" } as const;
type Population = keyof typeof POPULATION_LABELS;

function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function MiniAttendanceLine({
  label, points, strokeClass, fillClass, dotClass,
}: {
  label: string;
  points: DailyPoint[];
  strokeClass: string;
  fillClass: string;
  dotClass: string;
}) {
  const W = 320, H = 64, top = 6, bottom = 58;
  const n = points.length;
  const xAt = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (pct: number) => bottom - (Math.max(0, Math.min(100, pct)) / 100) * (bottom - top);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)},${yAt(p.pct).toFixed(1)}`).join(" ");
  const areaPath = n > 0 ? `${linePath} L ${xAt(n - 1).toFixed(1)},${bottom} L ${xAt(0).toFixed(1)},${bottom} Z` : "";
  const latest = points[n - 1];
  const avg = n > 0 ? Math.round((points.reduce((s, p) => s + p.pct, 0) / n) * 10) / 10 : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
          <span className={`h-2 w-2 rounded-sm ${dotClass}`} />
          {label}
        </span>
        {n > 0 && (
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Latest <span className="font-semibold text-gray-900 dark:text-zinc-50">{latest.pct}%</span>
            <span className="mx-1.5 text-gray-300 dark:text-zinc-600">·</span>
            Avg <span className="font-semibold text-gray-700 dark:text-zinc-200">{avg}%</span>
          </span>
        )}
      </div>

      {n === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400 dark:text-zinc-500">No records in this period</p>
      ) : (
        <>
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
            <line x1="0" y1={bottom} x2={W} y2={bottom} className="stroke-gray-100 dark:stroke-zinc-700" strokeWidth="1" />
            {areaPath && <path d={areaPath} className={fillClass} stroke="none" />}
            <path d={linePath} className={strokeClass} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={xAt(n - 1)} cy={yAt(latest.pct)} r="3" className={strokeClass} fill="currentColor" stroke="none" />
          </svg>
          <div className="mt-1 flex justify-between text-[9px] text-gray-400 dark:text-zinc-500">
            <span>{formatShortDate(points[0].date)}</span>
            {n > 2 && <span>{formatShortDate(points[Math.floor((n - 1) / 2)].date)}</span>}
            <span>{formatShortDate(points[n - 1].date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function AttendanceStatusPie({
  student, staff, studentSeries, staffSeries,
}: {
  student: Record<Range, AttendanceBucket>;
  staff: Record<Range, AttendanceBucket>;
  studentSeries: { week: DailyPoint[]; month: DailyPoint[] };
  staffSeries: { week: DailyPoint[]; month: DailyPoint[] };
}) {
  const [range, setRange] = useState<Range>("day");
  const [population, setPopulation] = useState<Population>("student");
  const isTrend = range === "week" || range === "month";

  const { present, absent, late, onLeave, unmarked } = (population === "student" ? student : staff)[range];

  const total = present + absent + late + onLeave + unmarked;
  const segments = [
    { label: "Present",    value: present,  stroke: "text-emerald-500", dot: "bg-emerald-400" },
    { label: "Absent",     value: absent,   stroke: "text-red-500",     dot: "bg-red-400" },
    { label: "Late",       value: late,     stroke: "text-amber-500",   dot: "bg-amber-400" },
    { label: "On leave",   value: onLeave,  stroke: "text-purple-500",  dot: "bg-purple-400" },
    { label: "Not marked", value: unmarked, stroke: "text-gray-300 dark:text-zinc-600", dot: "bg-gray-300 dark:bg-zinc-600" },
  ].filter((s) => s.value > 0);

  const r = 55;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = total > 0 ? (s.value / total) * circ : 0;
    const arc = { ...s, dash, offset };
    offset += dash;
    return arc;
  });
  const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Attendance</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {isTrend ? "Daily attendance rate — students & staff" : `Status mix, ${POPULATION_LABELS[population].toLowerCase()}`}
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-7 text-xs font-medium text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            {(Object.keys(RANGE_LABELS) as Range[]).map((k) => (
              <option key={k} value={k}>{RANGE_LABELS[k]}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>

      {isTrend ? (
        <div className="space-y-5">
          <MiniAttendanceLine
            label="Students"
            points={studentSeries[range]}
            strokeClass="text-primary-500 dark:text-primary-400"
            fillClass="fill-indigo-500/10 dark:fill-indigo-400/10"
            dotClass="bg-indigo-400"
          />
          <MiniAttendanceLine
            label="Staff"
            points={staffSeries[range]}
            strokeClass="text-sky-500 dark:text-sky-400"
            fillClass="fill-sky-500/10 dark:fill-sky-400/10"
            dotClass="bg-sky-400"
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-1 border-b border-gray-100 dark:border-zinc-700/50">
            {(Object.keys(POPULATION_LABELS) as Population[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setPopulation(k)}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                  population === k
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
              >
                {POPULATION_LABELS[k]}
              </button>
            ))}
          </div>

          {total === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No attendance data yet</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative shrink-0 self-center">
                <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
                  <circle cx="66" cy="66" r={r} fill="none" stroke="currentColor" strokeWidth="14"
                    className="text-gray-100 dark:text-zinc-700"
                  />
                  {arcs.map((a) => (
                    <circle
                      key={a.label}
                      cx="66" cy="66" r={r} fill="none"
                      stroke="currentColor" strokeWidth="14"
                      className={a.stroke}
                      strokeDasharray={`${a.dash} ${circ - a.dash}`}
                      strokeDashoffset={-a.offset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-zinc-50">{presentPct}%</span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">present</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 self-center">
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400">
                      <span className={`h-2 w-2 rounded-sm ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-zinc-50">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
