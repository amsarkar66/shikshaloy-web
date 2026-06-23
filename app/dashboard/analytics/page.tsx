"use client";

import { useState, useMemo } from "react";
import {
  Users, TrendingUp, TrendingDown, IndianRupee,
  GraduationCap, ClipboardCheck, Download, BarChart3,
  BookOpen,
} from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const PERIODS = ["This Term", "2025-26", "2024-25"] as const;
type Period = typeof PERIODS[number];

const ENROLLMENT_MONTHLY: Record<Period, { month: string; value: number }[]> = {
  "This Term": [
    { month: "Apr", value: 1210 },
    { month: "May", value: 1228 },
    { month: "Jun", value: 1247 },
  ],
  "2025-26": [
    { month: "Apr", value: 1180 },
    { month: "May", value: 1195 },
    { month: "Jun", value: 1210 },
    { month: "Jul", value: 1215 },
    { month: "Aug", value: 1220 },
    { month: "Sep", value: 1225 },
    { month: "Oct", value: 1230 },
    { month: "Nov", value: 1228 },
    { month: "Dec", value: 1235 },
    { month: "Jan", value: 1240 },
    { month: "Feb", value: 1243 },
    { month: "Mar", value: 1247 },
  ],
  "2024-25": [
    { month: "Apr", value: 1090 },
    { month: "May", value: 1105 },
    { month: "Jun", value: 1118 },
    { month: "Jul", value: 1125 },
    { month: "Aug", value: 1130 },
    { month: "Sep", value: 1138 },
    { month: "Oct", value: 1140 },
    { month: "Nov", value: 1145 },
    { month: "Dec", value: 1148 },
    { month: "Jan", value: 1160 },
    { month: "Feb", value: 1168 },
    { month: "Mar", value: 1175 },
  ],
};

const ATTENDANCE_MONTHLY: Record<Period, { month: string; value: number }[]> = {
  "This Term": [
    { month: "Apr", value: 91.2 },
    { month: "May", value: 93.5 },
    { month: "Jun", value: 94.2 },
  ],
  "2025-26": [
    { month: "Apr", value: 91.2 },
    { month: "May", value: 93.5 },
    { month: "Jun", value: 94.2 },
    { month: "Jul", value: 89.8 },
    { month: "Aug", value: 92.1 },
    { month: "Sep", value: 93.8 },
    { month: "Oct", value: 94.5 },
    { month: "Nov", value: 90.2 },
    { month: "Dec", value: 88.5 },
    { month: "Jan", value: 93.1 },
    { month: "Feb", value: 94.0 },
    { month: "Mar", value: 93.7 },
  ],
  "2024-25": [
    { month: "Apr", value: 88.4 },
    { month: "May", value: 90.1 },
    { month: "Jun", value: 91.5 },
    { month: "Jul", value: 87.2 },
    { month: "Aug", value: 89.0 },
    { month: "Sep", value: 90.3 },
    { month: "Oct", value: 91.8 },
    { month: "Nov", value: 88.0 },
    { month: "Dec", value: 86.9 },
    { month: "Jan", value: 90.5 },
    { month: "Feb", value: 91.2 },
    { month: "Mar", value: 90.8 },
  ],
};

const FEE_MONTHLY: Record<Period, { month: string; collected: number; target: number }[]> = {
  "This Term": [
    { month: "Apr", collected: 4.5, target: 5.1 },
    { month: "May", collected: 4.2, target: 5.1 },
    { month: "Jun", collected: 4.2, target: 5.1 },
  ],
  "2025-26": [
    { month: "Apr", collected: 4.5, target: 5.1 },
    { month: "May", collected: 4.2, target: 5.1 },
    { month: "Jun", collected: 4.2, target: 5.1 },
    { month: "Jul", collected: 4.8, target: 5.1 },
    { month: "Aug", collected: 4.6, target: 5.1 },
    { month: "Sep", collected: 4.9, target: 5.1 },
    { month: "Oct", collected: 5.0, target: 5.1 },
    { month: "Nov", collected: 4.3, target: 5.1 },
    { month: "Dec", collected: 4.1, target: 5.1 },
    { month: "Jan", collected: 4.7, target: 5.1 },
    { month: "Feb", collected: 4.8, target: 5.1 },
    { month: "Mar", collected: 4.2, target: 5.1 },
  ],
  "2024-25": [
    { month: "Apr", collected: 3.9, target: 4.5 },
    { month: "May", collected: 3.8, target: 4.5 },
    { month: "Jun", collected: 3.7, target: 4.5 },
    { month: "Jul", collected: 4.1, target: 4.5 },
    { month: "Aug", collected: 4.0, target: 4.5 },
    { month: "Sep", collected: 4.2, target: 4.5 },
    { month: "Oct", collected: 4.3, target: 4.5 },
    { month: "Nov", collected: 3.9, target: 4.5 },
    { month: "Dec", collected: 3.6, target: 4.5 },
    { month: "Jan", collected: 4.1, target: 4.5 },
    { month: "Feb", collected: 4.2, target: 4.5 },
    { month: "Mar", collected: 3.8, target: 4.5 },
  ],
};

const CLASS_ATTENDANCE = [
  { label: "Class 10", value: 96.3, students: 198 },
  { label: "Class 5",  value: 95.1, students: 215 },
  { label: "Class 8",  value: 94.9, students: 210 },
  { label: "Class 6",  value: 93.8, students: 207 },
  { label: "Class 7",  value: 92.4, students: 208 },
  { label: "Class 9",  value: 91.2, students: 209 },
];

const SUBJECT_PASS: Record<Period, { subject: string; passRate: number; avg: number }[]> = {
  "This Term": [
    { subject: "English",       passRate: 94, avg: 71 },
    { subject: "Hindi",         passRate: 88, avg: 65 },
    { subject: "Mathematics",   passRate: 72, avg: 54 },
    { subject: "Science",       passRate: 81, avg: 62 },
    { subject: "Social Studies",passRate: 89, avg: 67 },
  ],
  "2025-26": [
    { subject: "English",       passRate: 94, avg: 71 },
    { subject: "Hindi",         passRate: 88, avg: 65 },
    { subject: "Mathematics",   passRate: 72, avg: 54 },
    { subject: "Science",       passRate: 81, avg: 62 },
    { subject: "Social Studies",passRate: 89, avg: 67 },
  ],
  "2024-25": [
    { subject: "English",       passRate: 91, avg: 68 },
    { subject: "Hindi",         passRate: 85, avg: 63 },
    { subject: "Mathematics",   passRate: 68, avg: 51 },
    { subject: "Science",       passRate: 77, avg: 59 },
    { subject: "Social Studies",passRate: 86, avg: 64 },
  ],
};

const GRADE_DIST: Record<Period, { grade: string; pct: number; color: string }[]> = {
  "This Term": [
    { grade: "A+", pct: 18, color: "#6366f1" },
    { grade: "A",  pct: 25, color: "#22c55e" },
    { grade: "B+", pct: 20, color: "#3b82f6" },
    { grade: "B",  pct: 15, color: "#8b5cf6" },
    { grade: "C",  pct: 9,  color: "#f59e0b" },
    { grade: "D",  pct: 6,  color: "#f97316" },
    { grade: "F",  pct: 7,  color: "#ef4444" },
  ],
  "2025-26": [
    { grade: "A+", pct: 18, color: "#6366f1" },
    { grade: "A",  pct: 25, color: "#22c55e" },
    { grade: "B+", pct: 20, color: "#3b82f6" },
    { grade: "B",  pct: 15, color: "#8b5cf6" },
    { grade: "C",  pct: 9,  color: "#f59e0b" },
    { grade: "D",  pct: 6,  color: "#f97316" },
    { grade: "F",  pct: 7,  color: "#ef4444" },
  ],
  "2024-25": [
    { grade: "A+", pct: 14, color: "#6366f1" },
    { grade: "A",  pct: 22, color: "#22c55e" },
    { grade: "B+", pct: 21, color: "#3b82f6" },
    { grade: "B",  pct: 17, color: "#8b5cf6" },
    { grade: "C",  pct: 11, color: "#f59e0b" },
    { grade: "D",  pct: 7,  color: "#f97316" },
    { grade: "F",  pct: 8,  color: "#ef4444" },
  ],
};

const KPIS: Record<Period, {
  students: number;    studentDelta: number;
  attendance: number;  attendanceDelta: number;
  feeRate: number;     feeRateDelta: number;
  passRate: number;    passRateDelta: number;
}> = {
  "This Term": {
    students: 1247,  studentDelta: 37,
    attendance: 94.2, attendanceDelta: 1.8,
    feeRate: 84,      feeRateDelta: 2,
    passRate: 87.3,   passRateDelta: 1.4,
  },
  "2025-26": {
    students: 1247,  studentDelta: 72,
    attendance: 92.2, attendanceDelta: 1.4,
    feeRate: 87,      feeRateDelta: 4,
    passRate: 87.3,   passRateDelta: 1.4,
  },
  "2024-25": {
    students: 1175,  studentDelta: 85,
    attendance: 90.8, attendanceDelta: -0.6,
    feeRate: 83,      feeRateDelta: -1,
    passRate: 85.9,   passRateDelta: 3.2,
  },
};

// ── Chart: line (SVG polyline) ────────────────────────────────────────────────

function LineChart({
  data,
  color,
  areaColor,
  yMin,
  yMax,
  formatY,
  height = 120,
}: {
  data:     { month: string; value: number }[];
  color:    string;
  areaColor:string;
  yMin:     number;
  yMax:     number;
  formatY:  (v: number) => string;
  height?:  number;
}) {
  const W = 520;
  const H = height;
  const PAD_L = 36;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const range = yMax - yMin || 1;

  function xOf(i: number) {
    return PAD_L + (i / Math.max(data.length - 1, 1)) * chartW;
  }
  function yOf(v: number) {
    return PAD_T + (1 - (v - yMin) / range) * chartH;
  }

  const pts = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(" ");
  const area = [
    `${xOf(0)},${PAD_T + chartH}`,
    ...data.map((d, i) => `${xOf(i)},${yOf(d.value)}`),
    `${xOf(data.length - 1)},${PAD_T + chartH}`,
  ].join(" ");

  const yTicks = [yMin, yMin + (range / 2), yMax];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Y-axis ticks */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD_L} y1={yOf(t)} x2={W - PAD_R} y2={yOf(t)}
            stroke="currentColor" strokeWidth="0.5"
            className="text-gray-100 dark:text-zinc-800"
          />
          <text
            x={PAD_L - 4} y={yOf(t) + 3.5}
            textAnchor="end" fontSize="9" fill="currentColor"
            className="fill-gray-400 dark:fill-zinc-600"
          >
            {formatY(t)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={area} fill={areaColor} />

      {/* Line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Points + X labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(d.value)} r="3" fill={color} />
          <text
            x={xOf(i)} y={H - 4}
            textAnchor="middle" fontSize="9" fill="currentColor"
            className="fill-gray-400 dark:fill-zinc-600"
          >
            {d.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Chart: grouped bar ────────────────────────────────────────────────────────

function FeeBarChart({ data }: {
  data: { month: string; collected: number; target: number }[];
}) {
  const W = 900;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...data.map((d) => d.target)) * 1.1;
  const barGroupW = chartW / data.length;
  const barW = barGroupW * 0.32;
  const gap  = barGroupW * 0.06;
  const yTicks = [0, maxVal / 2, maxVal];

  function xGroupStart(i: number) {
    return PAD_L + i * barGroupW + barGroupW * 0.1;
  }
  function barH(v: number) { return (v / maxVal) * chartH; }
  function yTop(v: number) { return PAD_T + chartH - barH(v); }
  function yOf(v: number)  { return PAD_T + (1 - v / maxVal) * chartH; }

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
            {/* target bar */}
            <rect x={x1} y={yTop(d.target)} width={barW} height={barH(d.target)}
              rx="2" fill="currentColor" className="text-gray-200 dark:text-zinc-700" />
            {/* collected bar */}
            <rect x={x2} y={yTop(d.collected)} width={barW} height={barH(d.collected)}
              rx="2" fill="#6366f1" />
            {/* X label */}
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

function DonutChart({ data }: { data: { grade: string; pct: number; color: string }[] }) {
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

  const passTotal = data.slice(0, 4).reduce((a, b) => a + b.pct, 0);

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
  label, value, sub, delta, icon: Icon, accent,
}: {
  label:  string;
  value:  string;
  sub:    string;
  delta:  number;
  icon:   React.ElementType;
  accent: string;
}) {
  const up = delta >= 0;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? "+" : ""}{delta}{typeof delta === "number" && !Number.isInteger(delta) ? "" : ""}
        </span>
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

function ClassAttendanceBars() {
  return (
    <div className="space-y-3">
      {CLASS_ATTENDANCE.map((c) => (
        <div key={c.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-zinc-300">{c.label}</span>
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
          <span className="w-16 text-right text-[11px] text-gray-400 dark:text-zinc-500">{c.students} students</span>
        </div>
      ))}
    </div>
  );
}

// ── Subject pass rate table ───────────────────────────────────────────────────

function SubjectTable({ data }: { data: typeof SUBJECT_PASS["This Term"] }) {
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
                <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${s.avg}%` }} />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">{s.avg}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("This Term");

  const kpi         = KPIS[period];
  const enrollment  = ENROLLMENT_MONTHLY[period];
  const attendance  = ATTENDANCE_MONTHLY[period];
  const feeData     = FEE_MONTHLY[period];
  const subjectData = SUBJECT_PASS[period];
  const gradeData   = GRADE_DIST[period];

  const enrollMin = useMemo(() => Math.min(...enrollment.map((d) => d.value)) - 20, [enrollment]);
  const enrollMax = useMemo(() => Math.max(...enrollment.map((d) => d.value)) + 10, [enrollment]);
  const attMin    = useMemo(() => Math.floor(Math.min(...attendance.map((d) => d.value)) - 2), [attendance]);
  const attMax    = useMemo(() => Math.ceil( Math.max(...attendance.map((d) => d.value)) + 1), [attendance]);

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">School-wide performance overview</p>
        </div>

        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Students"
          value={kpi.students.toLocaleString("en-IN")}
          sub={`+${kpi.studentDelta} vs prior period`}
          delta={kpi.studentDelta}
          icon={Users}
          accent="text-blue-500 bg-blue-500/10"
        />
        <KpiCard
          label="Avg Attendance"
          value={`${kpi.attendance}%`}
          sub={`${kpi.attendanceDelta > 0 ? "▲" : "▼"} ${Math.abs(kpi.attendanceDelta)}% vs prior`}
          delta={kpi.attendanceDelta}
          icon={ClipboardCheck}
          accent="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard
          label="Fee Collection Rate"
          value={`${kpi.feeRate}%`}
          sub={`${kpi.feeRateDelta > 0 ? "▲" : "▼"} ${Math.abs(kpi.feeRateDelta)}pp vs prior`}
          delta={kpi.feeRateDelta}
          icon={IndianRupee}
          accent="text-indigo-500 bg-indigo-500/10"
        />
        <KpiCard
          label="Overall Pass Rate"
          value={`${kpi.passRate}%`}
          sub={`${kpi.passRateDelta > 0 ? "▲" : "▼"} ${Math.abs(kpi.passRateDelta)}% vs prior`}
          delta={kpi.passRateDelta}
          icon={GraduationCap}
          accent="text-violet-500 bg-violet-500/10"
        />
      </div>

      {/* Enrollment + Attendance trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Enrollment */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Enrollment Trend</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Monthly active student count</p>
          </div>
          <LineChart
            data={enrollment}
            color="#6366f1"
            areaColor="rgba(99,102,241,0.08)"
            yMin={enrollMin}
            yMax={enrollMax}
            formatY={(v) => v.toLocaleString("en-IN")}
            height={130}
          />
        </div>

        {/* Attendance trend */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Attendance Trend</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Monthly school-wide attendance %</p>
          </div>
          <LineChart
            data={attendance}
            color="#22c55e"
            areaColor="rgba(34,197,94,0.08)"
            yMin={attMin}
            yMax={attMax}
            formatY={(v) => `${v}%`}
            height={130}
          />
        </div>
      </div>

      {/* Fee collection bar chart */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Collection</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Collected vs target per month (₹ Lakhs)</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-zinc-700" /> Target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Collected
            </span>
          </div>
        </div>
        <FeeBarChart data={feeData} />
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
          <ClassAttendanceBars />
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
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              {period === "This Term" ? "Unit Test 1 — 2026-27" : period === "2025-26" ? "Annual Exam — 2025-26" : "Annual Exam — 2024-25"}
            </p>
          </div>
          <DonutChart data={gradeData} />
        </div>
      </div>

      {/* Subject-wise performance */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Pass rate and average score across all classes</p>
        <SubjectTable data={subjectData} />
      </div>

    </div>
  );
}
