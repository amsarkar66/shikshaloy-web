"use client";

import { useState, useMemo } from "react";
import {
  FileBarChart, GraduationCap, UserCheck, CreditCard,
  Users, Download, RefreshCw, Clock, Calendar,
  Search, X, ChevronDown, FileText, FileSpreadsheet,
  CheckCircle2, Repeat, Zap,
} from "lucide-react";
import {
  ALL_REPORTS, RECENT_REPORTS, CATEGORY_META, FORMAT_META,
  formatDate, formatDateTime,
  type Report, type ReportCategory, type ReportFormat,
} from "./_data/reports";

// ── Category tabs ─────────────────────────────────────────────────────────────

type Tab = "all" | ReportCategory;

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "all",        label: "All Reports", icon: FileBarChart },
  { value: "academic",   label: "Academic",    icon: GraduationCap },
  { value: "attendance", label: "Attendance",  icon: UserCheck },
  { value: "finance",    label: "Finance",     icon: CreditCard },
  { value: "student",    label: "Student",     icon: Users },
];

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const total     = ALL_REPORTS.length;
  const scheduled = ALL_REPORTS.filter((r) => r.isScheduled).length;
  const generated = RECENT_REPORTS.filter((r) => r.generatedAt.startsWith("2026-06-23")).length;
  const never     = ALL_REPORTS.filter((r) => !r.lastGenerated).length;

  const items = [
    { label: "Total Reports",     value: total,     icon: FileBarChart, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Generated Today",   value: generated, icon: Zap,          accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Scheduled Reports", value: scheduled, icon: Repeat,       accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Never Generated",   value: never,     icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
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

// ── Format badge ──────────────────────────────────────────────────────────────

function FormatBadge({ fmt }: { fmt: ReportFormat }) {
  const meta = FORMAT_META[fmt];
  const Icon = fmt === "pdf" ? FileText : FileSpreadsheet;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  );
}

// ── Generate modal ────────────────────────────────────────────────────────────

function GenerateModal({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const [format, setFormat]     = useState<ReportFormat>(report.formats[0]);
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo]     = useState("2026-06-23");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const catMeta = CATEGORY_META[report.category];

  function handleGenerate() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catMeta.bg}`}>
            <FileBarChart className={`h-4.5 w-4.5 h-5 w-5 ${catMeta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{report.name}</p>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${catMeta.color}`}>
              {catMeta.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Report Generated!</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                Your {format.toUpperCase()} report is ready. It has been added to the recent reports list.
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Close
                </button>
                <button className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white transition-colors">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Format */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Output Format</p>
                <div className="flex gap-2">
                  {report.formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-colors ${
                        format === f
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400 dark:text-zinc-500">{report.description}</p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-sm font-medium text-white transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" /> Generate
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ report, onGenerate }: { report: Report; onGenerate: (r: Report) => void }) {
  const catMeta = CATEGORY_META[report.category];
  const CatIcon =
    report.category === "academic"   ? GraduationCap :
    report.category === "attendance" ? UserCheck :
    report.category === "finance"    ? CreditCard :
    Users;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">

      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catMeta.bg}`}>
          <CatIcon className={`h-4.5 w-4.5 h-5 w-5 ${catMeta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 leading-tight">{report.name}</p>
            {report.isScheduled && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                <Repeat className="h-2.5 w-2.5" /> {report.scheduleLabel}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${catMeta.color}`}>
            {catMeta.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
        {report.description}
      </p>

      {/* Formats */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {report.formats.map((f) => <FormatBadge key={f} fmt={f} />)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
          <Calendar className="h-3 w-3 shrink-0" />
          {report.lastGenerated ? (
            <span>Last: {formatDate(report.lastGenerated)}</span>
          ) : (
            <span className="text-amber-500 dark:text-amber-400 font-medium">Never generated</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onGenerate(report)}
            className="flex h-7 items-center gap-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-2.5 text-[11px] font-semibold text-white transition-colors"
          >
            <Zap className="h-3 w-3" /> Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recent reports table ──────────────────────────────────────────────────────

function RecentReports() {
  const catIcon = (cat: ReportCategory) => {
    const Icon =
      cat === "academic"   ? GraduationCap :
      cat === "attendance" ? UserCheck :
      cat === "finance"    ? CreditCard :
      Users;
    return Icon;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Recent Reports</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Last 8 generated reports</p>
        </div>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export Log
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
              {["Report", "Category", "Format", "Generated At", "By", "Size", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {RECENT_REPORTS.map((r) => {
              const catMeta = CATEGORY_META[r.category];
              const Icon    = catIcon(r.category);
              return (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${catMeta.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${catMeta.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                        {r.reportName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${catMeta.color}`}>
                      {catMeta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <FormatBadge fmt={r.format} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {formatDateTime(r.generatedAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400">
                    {r.generatedBy}
                  </td>
                  <td className="px-4 py-3 text-xs tabular-nums text-gray-500 dark:text-zinc-400">
                    {r.sizeKb} KB
                  </td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors whitespace-nowrap">
                      <Download className="h-3 w-3" /> Download
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab,     setTab]     = useState<Tab>("all");
  const [query,   setQuery]   = useState("");
  const [modal,   setModal]   = useState<Report | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_REPORTS.filter((r) => {
      const matchTab  = tab === "all" || r.category === tab;
      const matchQ    = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [tab, query]);

  const hasFilter = query || tab !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Reports</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Generate, download, and schedule school reports
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Repeat className="h-3.5 w-3.5" /> Schedules
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors">
            <Download className="h-4 w-4" /> Download All
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit overflow-x-auto">
          {TABS.map(({ value, label, icon: Icon }) => {
            const count = value === "all"
              ? ALL_REPORTS.length
              : ALL_REPORTS.filter((r) => r.category === value).length;
            return (
              <button
                key={value}
                onClick={() => { setTab(value); }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  tab === value
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  tab === value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-8 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_REPORTS.length}</span> reports
        </p>
        {hasFilter && (
          <button
            onClick={() => { setTab("all"); setQuery(""); }}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Report cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <FileBarChart className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No reports found</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} onGenerate={setModal} />
          ))}
        </div>
      )}

      {/* Recent reports */}
      <RecentReports />

      {/* Generate modal */}
      {modal && (
        <GenerateModal report={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
