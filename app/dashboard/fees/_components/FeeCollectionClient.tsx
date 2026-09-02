"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Landmark, Search, Wallet, AlertTriangle, TrendingUp, Users, Download,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, Settings2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

export interface SchoolFeeSummary {
  id: string;
  name: string;
  due: number;
  paid: number;
  pending: number;
  collectionPct: number;
  hasData: boolean;
  monthLabel: string;
}

export interface Defaulter {
  studentId: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  due: number;
  paid: number;
  pending: number;
}

export interface MonthTrend {
  month: string;
  due: number;
  paid: number;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
  color: string;
}

export interface ModeSlice {
  mode: string;
  amount: number;
  pct: number;
}

const PAGE_SIZE = 25;

const MODE_COLORS: Record<string, string> = {
  Online: "bg-blue-500",
  Cash: "bg-emerald-500",
  Cheque: "bg-amber-500",
  UPI: "bg-violet-500",
};

const inputClass =
  "h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function formatCurrency(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;
}

function collectionColor(pct: number) {
  return pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : "bg-amber-500";
}

function collectionStatus(pct: number, hasData: boolean) {
  if (!hasData) return { label: "No data", className: "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400 border-gray-200 dark:border-zinc-700" };
  if (pct >= 85) return { label: "On Track", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  if (pct >= 70) return { label: "Watch", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
  return { label: "At Risk", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
}

// ── Trend chart: due vs collected, last 12 months ───────────────────────────

function TrendChart({ data }: { data: MonthTrend[] }) {
  // Bars/gridlines are drawn in an SVG with preserveAspectRatio="none" so
  // they reliably stretch to the container's full width from the very first
  // paint — no JS measurement, no race condition. Axis labels are rendered
  // as plain positioned HTML *outside* that SVG (at the matching percentage
  // offsets) instead of <text> inside it, since anything inside a
  // non-uniformly-scaled SVG gets stretched too — this keeps label text at
  // a fixed, consistent size regardless of how wide the chart renders.
  const W = 900;
  const H = 180;
  const PAD_L = 2;
  const PAD_R = 2;
  const PAD_T = 18;
  const PAD_B = 24;
  const LABEL_GAP = 3;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...data.map((d) => d.due), 1) * 1.1;
  const barGroupW = chartW / Math.max(data.length, 1);
  const barW = barGroupW * 0.32;
  const gap = barGroupW * 0.06;
  const yTicks = [0, maxVal / 2, maxVal];

  function xGroupStart(i: number) { return PAD_L + i * barGroupW + barGroupW * 0.1; }
  function barH(v: number) { return (v / maxVal) * chartH; }
  function yTop(v: number) { return PAD_T + chartH - barH(v); }
  function yOf(v: number) { return PAD_T + (1 - v / maxVal) * chartH; }
  function pctX(x: number) { return (x / W) * 100; }
  function pctY(y: number) { return (y / H) * 100; }

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No fee payment data yet</p>;
  }

  return (
    <div className="relative w-full" style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {yTicks.map((t) => (
          <line
            key={t}
            x1={PAD_L} y1={yOf(t)} x2={W - PAD_R} y2={yOf(t)}
            stroke="currentColor" strokeWidth="0.5" vectorEffect="non-scaling-stroke"
            className="text-gray-100 dark:text-zinc-800"
          />
        ))}
        {data.map((d, i) => {
          const x1 = xGroupStart(i);
          const x2 = x1 + barW + gap;
          return (
            <g key={d.month}>
              <rect x={x1} y={yTop(d.due)} width={barW} height={barH(d.due)} rx="2" fill="currentColor" className="text-gray-200 dark:text-zinc-700" />
              <rect x={x2} y={yTop(d.paid)} width={barW} height={barH(d.paid)} rx="2" fill="#6366f1" />
            </g>
          );
        })}
      </svg>

      {yTicks.map((t) => (
        <span
          key={t}
          className="absolute -translate-y-full whitespace-nowrap text-left text-[9px] text-gray-400 dark:text-zinc-600"
          style={{ left: 0, top: `${pctY(yOf(t) - LABEL_GAP)}%` }}
        >
          {formatCurrency(t)}
        </span>
      ))}
      {data.map((d, i) => {
        const x1 = xGroupStart(i);
        return (
          <span
            key={d.month}
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[9px] text-gray-400 dark:text-zinc-600"
            style={{ left: `${pctX(x1 + barW + gap / 2)}%` }}
          >
            {d.month}
          </span>
        );
      })}
    </div>
  );
}

// ── Fee-head (category) donut ───────────────────────────────────────────────

function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const R = 48;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * R;
  const total = data.reduce((a, b) => a + b.amount, 0);

  let offset = circ * 0.25;
  const slices = data.map((d) => {
    const dash = (d.pct / 100) * circ;
    const s = { ...d, dash, offset };
    offset += dash;
    return s;
  });

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No fee data yet</p>;
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
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="fill-gray-900 dark:fill-zinc-50">
            {formatCurrency(total)}
          </text>
          <text x={cx} y={cy + 11} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-gray-400 dark:fill-zinc-500">
            Total due
          </text>
        </svg>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {data.map((d) => (
          <div key={d.category} className="flex items-center gap-2 min-w-0">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="text-xs text-gray-600 dark:text-zinc-400 truncate">{d.category}</span>
            <span className="ml-auto text-xs font-semibold text-gray-800 dark:text-zinc-200 whitespace-nowrap">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payment-mode breakdown ──────────────────────────────────────────────────

function ModeBars({ data }: { data: ModeSlice[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No payments recorded yet</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((m) => (
        <div key={m.mode} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-zinc-300">{m.mode}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-2 rounded-full ${MODE_COLORS[m.mode] ?? "bg-gray-400"}`} style={{ width: `${m.pct}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">{m.pct}%</span>
          <span className="w-20 text-right text-[11px] text-gray-400 dark:text-zinc-500">{formatCurrency(m.amount)}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeeCollectionClient({
  schools, defaulters, trend, categoryBreakdown, modeBreakdown, currentMonthLabel,
}: {
  schools: SchoolFeeSummary[];
  defaulters: Defaulter[];
  trend: MonthTrend[];
  categoryBreakdown: CategorySlice[];
  modeBreakdown: ModeSlice[];
  currentMonthLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [schoolSort, setSchoolSort] = useState<"name" | "pct-asc" | "pct-desc">("pct-asc");

  const totalDue = schools.reduce((s, x) => s + x.due, 0);
  const totalPaid = schools.reduce((s, x) => s + x.paid, 0);
  const totalPending = schools.reduce((s, x) => s + x.pending, 0);
  const avgCollectionPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const onTrackCount = schools.filter((s) => s.hasData && s.collectionPct >= 85).length;

  const sortedSchools = useMemo(() => {
    const list = [...schools];
    if (schoolSort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (schoolSort === "pct-asc") list.sort((a, b) => a.collectionPct - b.collectionPct);
    else list.sort((a, b) => b.collectionPct - a.collectionPct);
    return list;
  }, [schools, schoolSort]);

  const filteredDefaulters = useMemo(() => {
    let list = defaulters;
    if (schoolFilter !== "all") list = list.filter((d) => d.schoolId === schoolFilter);
    const q = query.toLowerCase();
    if (q) list = list.filter((d) => d.studentName.toLowerCase().includes(q) || d.schoolName.toLowerCase().includes(q));
    return [...list].sort((a, b) => (sortDir === "desc" ? b.pending - a.pending : a.pending - b.pending));
  }, [query, schoolFilter, sortDir, defaulters]);

  const totalPages = Math.max(1, Math.ceil(filteredDefaulters.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = filteredDefaulters.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
  const hasFilter = query !== "" || schoolFilter !== "all";

  function clearFilters() {
    setQuery("");
    setSchoolFilter("all");
    setPage(1);
  }

  function exportCsv() {
    const header = ["Student", "School", "Due", "Paid", "Pending"];
    const lines = filteredDefaulters.map((d) => [d.studentName, d.schoolName, d.due, d.paid, d.pending]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-defaulters-${currentMonthLabel.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stats = [
    { label: "Total Due (this month)", value: formatCurrency(totalDue), icon: Wallet, accent: "text-blue-500 bg-blue-500/10" },
    { label: "Collected", value: formatCurrency(totalPaid), icon: TrendingUp, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Pending", value: formatCurrency(totalPending), icon: AlertTriangle, accent: "text-amber-500 bg-amber-500/10" },
    { label: "Avg Collection Rate", value: `${avgCollectionPct}%`, icon: Users, accent: "text-violet-500 bg-violet-500/10" },
    { label: "Schools On Track", value: `${onTrackCount}/${schools.length}`, icon: CheckCircle2, accent: "text-teal-500 bg-teal-500/10" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Fee Collection</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Collection progress across schools and outstanding student dues</p>
        </div>
        <Link
          href="/dashboard/fees/structure"
          className="sm:ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors w-fit"
        >
          <Settings2 className="h-3.5 w-3.5" /> Fee Structure
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 dark:text-zinc-50 truncate">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Collection Trend</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Due vs collected, last {trend.length || 12} months across all schools</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200 dark:bg-zinc-700" /> Due</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary-500" /> Collected</span>
          </div>
        </div>
        <TrendChart data={trend} />
      </div>

      {/* Fee-head + payment-mode breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Head Breakdown</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Amount due by category — {currentMonthLabel}</p>
          </div>
          <CategoryDonut data={categoryBreakdown} />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Payment Modes</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Collected amount by mode — {currentMonthLabel}</p>
          </div>
          <ModeBars data={modeBreakdown} />
        </div>
      </div>

      {/* Collection by school */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Collection by School</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{currentMonthLabel} · click a school to view details</p>
          </div>
          <div className="relative">
            <select value={schoolSort} onChange={(e) => setSchoolSort(e.target.value as typeof schoolSort)} className={`${inputClass} appearance-none pl-3 pr-8`}>
              <option value="pct-asc">Sort: Worst collection first</option>
              <option value="pct-desc">Sort: Best collection first</option>
              <option value="name">Sort: Name</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        </div>
        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-14 text-center">
            <Landmark className="h-7 w-7 text-gray-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No schools yet</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 divide-y divide-gray-100 dark:divide-zinc-700/50">
            {sortedSchools.map((s) => {
              const status = collectionStatus(s.collectionPct, s.hasData);
              return (
                <Link key={s.id} href={`/dashboard/schools/${s.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Landmark className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.name}</p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                      <span>{formatCurrency(s.paid)} / {formatCurrency(s.due)}</span>
                      <span className="font-semibold text-gray-700 dark:text-zinc-300 w-10 text-right">{s.hasData ? `${s.collectionPct}%` : "—"}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                    <div className={`h-1.5 rounded-full ${collectionColor(s.collectionPct)}`} style={{ width: `${Math.min(s.collectionPct, 100)}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Defaulters */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Defaulters ({filteredDefaulters.length})</h3>
          <FancyButton variant="white" size="xs" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </FancyButton>
        </div>

        <div className="mb-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search student or school…"
              className={`${inputClass} w-full pl-8 pr-3`}
            />
          </div>
          <div className="relative">
            <select value={schoolFilter} onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }} className={`${inputClass} appearance-none pl-3 pr-8`}>
              <option value="all">All Schools</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
          {hasFilter && (
            <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        <Table
          footer={totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(clampedPage - 1) * PAGE_SIZE + 1}-{Math.min(clampedPage * PAGE_SIZE, filteredDefaulters.length)}</span> of{" "}
                <span className="font-medium text-gray-700 dark:text-zinc-300">{filteredDefaulters.length}</span> defaulters
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={clampedPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-xs text-gray-500 dark:text-zinc-400">Page {clampedPage} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={clampedPage === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        >
          <TableHead>
            <Th position="first">Student</Th>
            <Th>School</Th>
            <Th align="right">Due</Th>
            <Th align="right">Paid</Th>
            <Th position="last" align="right">
              <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                Pending
                {sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </Th>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableEmptyRow colSpan={5} message="No outstanding dues" />
            ) : (
              pageRows.map((d) => (
                <Tr key={d.studentId}>
                  <Td position="first" className="font-medium text-gray-900 dark:text-zinc-100">{d.studentName}</Td>
                  <Td className="text-gray-600 dark:text-zinc-400">{d.schoolName}</Td>
                  <Td align="right" className="text-gray-700 dark:text-zinc-300">{formatCurrency(d.due)}</Td>
                  <Td align="right" className="text-gray-700 dark:text-zinc-300">{formatCurrency(d.paid)}</Td>
                  <Td position="last" align="right" className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(d.pending)}</Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
