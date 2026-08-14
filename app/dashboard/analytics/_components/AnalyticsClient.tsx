"use client";

import {
  Users, IndianRupee, GraduationCap, ClipboardCheck,
  Download, BarChart3, BookOpen,
} from "lucide-react";
import type { FeeMonth, ClassAttendance, SubjectPerf, GradeSlice } from "../_data/analytics";

// ── Chart: grouped bar (fee collection) ───────────────────────────────────────

function FeeBarChart({ data }: { data: FeeMonth[] }) {
  const W = 900;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...data.map((d) => d.due), 0.1) * 1.1;
  const barGroupW = chartW / Math.max(data.length, 1);
  const barW = barGroupW * 0.32;
  const gap  = barGroupW * 0.06;
  const yTicks = [0, maxVal / 2, maxVal];

  function xGroupStart(i: number) {
    return PAD_L + i * barGroupW + barGroupW * 0.1;
  }
  function barH(v: number) { return (v / maxVal) * chartH; }
  function yTop(v: number) { return PAD_T + chartH - barH(v); }
  function yOf(v: number)  { return PAD_T + (1 - v / maxVal) * chartH; }

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No fee payment data yet</p>;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD_L} y1={yOf(t)} x2={W - PAD_R} y2={yOf(t)}
            stroke="currentColor" strokeWidth="0.5"
            className="text-gray-100 dark:text-zinc-800" />
          <text x={PAD_L - 4} y={yOf(t) + 3.5} textAnchor="end" fontSize="9"
            className="fill-gray-400 dark:fill-zinc-600">
            ₹{t.toFixed(1)}L
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const x1 = xGroupStart(i);
        const x2 = x1 + barW + gap;
        return (
          <g key={d.month}>
            <rect x={x1} y={yTop(d.due)} width={barW} height={barH(d.due)}
              rx="2" fill="currentColor" className="text-gray-200 dark:text-zinc-700" />
            <rect x={x2} y={yTop(d.collected)} width={barW} height={barH(d.collected)}
              rx="2" fill="#6366f1" />
            <text x={x1 + barW + gap / 2} y={H - 6} textAnchor="middle" fontSize="9"
              className="fill-gray-400 dark:fill-zinc-600">
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: GradeSlice[] }) {
  const R = 48;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * R;

  let offset = circ * 0.25;
  const slices = data.map((d) => {
    const dash = (d.pct / 100) * circ;
    const s = { ...d, dash, offset };
    offset += dash;
    return s;
  });

  const passTotal = data.filter((d) => d.grade !== "F").reduce((a, b) => a + b.pct, 0);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No exam results yet</p>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={s.color} strokeWidth="18"
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={-s.offset + circ * 0.25}
            />
          ))}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor" className="fill-gray-900 dark:fill-zinc-50">
            {passTotal}%
          </text>
          <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-gray-400 dark:fill-zinc-500">
            A–B grades
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
        {data.map((d) => (
          <div key={d.grade} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="text-xs text-gray-600 dark:text-zinc-400">{d.grade}</span>
            <span className="ml-auto text-xs font-semibold text-gray-800 dark:text-zinc-200">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label:  string;
  value:  string;
  sub:    string;
  icon:   React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">{sub}</p>
      </div>
    </div>
  );
}

// ── Class attendance bars ─────────────────────────────────────────────────────

function ClassAttendanceBars({ data }: { data: ClassAttendance[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No students enrolled yet</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div key={c.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs font-medium text-gray-700 dark:text-zinc-300">{c.label}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div
              className={`h-2 rounded-full ${
                c.value >= 95 ? "bg-emerald-500"
                : c.value >= 90 ? "bg-blue-500"
                : "bg-amber-500"
              }`}
              style={{ width: `${c.value}%` }}
            />
          </div>
          <span className={`w-12 text-right text-xs font-semibold tabular-nums ${
            c.value >= 95 ? "text-emerald-600 dark:text-emerald-400"
            : c.value >= 90 ? "text-blue-600 dark:text-blue-400"
            : "text-amber-600 dark:text-amber-400"
          }`}>{c.value}%</span>
          <span className="w-20 text-right text-[11px] text-gray-400 dark:text-zinc-500">{c.students} student{c.students !== 1 ? "s" : ""}</span>
        </div>
      ))}
    </div>
  );
}

// ── Subject pass rate table ───────────────────────────────────────────────────

function SubjectTable({ data }: { data: SubjectPerf[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No exam results yet</p>;
  }
  return (
    <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
      {data.map((s) => (
        <div key={s.subject} className="flex items-center gap-4 py-3">
          <span className="w-32 shrink-0 text-sm font-medium text-gray-800 dark:text-zinc-200">{s.subject}</span>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 w-16">Pass rate</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div
                  className={`h-1.5 rounded-full ${s.passRate >= 90 ? "bg-emerald-500" : s.passRate >= 75 ? "bg-blue-500" : "bg-amber-500"}`}
                  style={{ width: `${s.passRate}%` }}
                />
              </div>
              <span className={`w-8 text-right text-xs font-bold tabular-nums ${s.passRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : s.passRate >= 75 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                {s.passRate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 w-16">Avg score</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div className="h-1.5 rounded-full bg-primary-400" style={{ width: `${s.avg}%` }} />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-primary-600 dark:text-primary-400 tabular-nums">{s.avg}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsClient({
  academicYear, kpi, feeMonths, classAttendance, gradeDist, subjectPerf,
}: {
  academicYear: string;
  kpi: { totalStudents: number; avgAttendance: number; feeCollectionRate: number; overallPassRate: number };
  feeMonths: FeeMonth[];
  classAttendance: ClassAttendance[];
  gradeDist: GradeSlice[];
  subjectPerf: SubjectPerf[];
}) {
  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">School-wide performance overview — {academicYear}</p>
        </div>

        <div className="sm:ml-auto flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Students"
          value={kpi.totalStudents.toLocaleString("en-IN")}
          sub="Currently enrolled"
          icon={Users}
          accent="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          label="Avg Attendance"
          value={`${kpi.avgAttendance}%`}
          sub="Across all students"
          icon={ClipboardCheck}
          accent="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          label="Fee Collection Rate"
          value={`${kpi.feeCollectionRate}%`}
          sub="Paid vs due, this year"
          icon={IndianRupee}
          accent="text-primary-500 bg-primary-500/10"
        />
        <KpiCard
          label="Overall Pass Rate"
          value={`${kpi.overallPassRate}%`}
          sub="Latest examination"
          icon={GraduationCap}
          accent="text-violet-500 bg-violet-500/10"
        />
      </div>

      {/* Fee collection bar chart */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Collection</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Collected vs due per month (₹ Lakhs)</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-zinc-700" /> Due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-primary-500" /> Collected
            </span>
          </div>
        </div>
        <FeeBarChart data={feeMonths} />
      </div>

      {/* Class attendance + Grade distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Class-wise attendance */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Class-wise Attendance</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Sorted by attendance rate</p>
          </div>
          <ClassAttendanceBars data={classAttendance} />
          <div className="mt-4 flex items-center gap-4 border-t border-gray-100 dark:border-zinc-700/50 pt-3">
            {[
              { color: "bg-emerald-500", label: "≥95%" },
              { color: "bg-blue-500",    label: "90–94%" },
              { color: "bg-amber-500",   label: "<90%" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
                <span className={`h-2 w-2 rounded-sm ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grade distribution */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Grade Distribution</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Latest examination</p>
          </div>
          <DonutChart data={gradeDist} />
        </div>
      </div>

      {/* Subject-wise performance */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Pass rate and average score across all classes</p>
        <SubjectTable data={subjectPerf} />
      </div>

    </div>
  );
}
