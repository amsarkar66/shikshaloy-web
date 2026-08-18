"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileBarChart, GraduationCap, UserCheck, CreditCard,
  Users, Download, RefreshCw, Clock, Calendar,
  Search, X, FileText, FileSpreadsheet,
  CheckCircle2, Repeat, Zap, Loader2, Sparkles, Plus, Pencil, Trash2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmptyRow } from "@/components/ui/data-table";
import {
  CATEGORY_META, FORMAT_META,
  formatDate, formatDateTime,
  type Report, type ReportCategory, type ReportFormat, type RecentReport,
} from "../_data/reports";
import { generateReport, downloadRecentReport, deleteCustomReport } from "../actions";
import type { ReportTable } from "../report-data";
import { downloadCsv } from "../_lib/csv";
import { downloadReportTable } from "../_lib/download-report";
import CustomReportBuilderModal, { type CustomReportEditTarget } from "./CustomReportBuilderModal";

const DEFAULT_FROM = "2026-04-01";
const DEFAULT_TO = new Date().toISOString().slice(0, 10);

// ── Top-level tabs ────────────────────────────────────────────────────────────

type MainTab = "overview" | "downloads" | "schedules";

const MAIN_TABS: { value: MainTab; label: string; icon: React.ElementType }[] = [
  { value: "overview",  label: "Overview",  icon: FileBarChart },
  { value: "downloads", label: "Downloads", icon: Download },
  { value: "schedules", label: "Schedules", icon: Repeat },
];

// ── Category tabs ─────────────────────────────────────────────────────────────

type Tab = "all" | ReportCategory;

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "all",        label: "All Reports", icon: FileBarChart },
  { value: "academic",   label: "Academic",    icon: GraduationCap },
  { value: "attendance", label: "Attendance",  icon: UserCheck },
  { value: "finance",    label: "Finance",     icon: CreditCard },
  { value: "student",    label: "Student",     icon: Users },
  { value: "custom",     label: "Custom",      icon: Sparkles },
];

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ reports, recentReports }: { reports: Report[]; recentReports: RecentReport[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const total     = reports.length;
  const scheduled = reports.filter((r) => r.isScheduled).length;
  const generated = recentReports.filter((r) => r.generatedAt.startsWith(today)).length;
  const never     = reports.filter((r) => !r.lastGenerated).length;

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
  report, onClose, onGenerated,
}: {
  report: Report;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [format, setFormat]     = useState<ReportFormat>(report.formats[0]);
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM);
  const [dateTo, setDateTo]     = useState(DEFAULT_TO);
  const [table, setTable]       = useState<ReportTable | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const catMeta = CATEGORY_META[report.category];

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateReport({ reportId: report.id, reportName: report.name, category: report.category, format, dateFrom, dateTo });
      setTable(result);
      onGenerated();
    });
  }

  async function handleDownload() {
    if (!table) return;
    setDownloading(true);
    try {
      await downloadReportTable(report.name, table, format);
    } finally {
      setDownloading(false);
    }
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
          {table ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Report Generated!</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                {table.rows.length} row{table.rows.length === 1 ? "" : "s"} of live data ready as {format.toUpperCase()}. It has been added to the recent reports list.
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Close
                </button>
                <FancyButton size="sm" className="flex-1" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download
                </FancyButton>
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
                          ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                          : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">Downloads live data in the selected format.</p>
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
                    className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
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
                    className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
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
                <FancyButton
                  onClick={handleGenerate}
                  disabled={isPending}
                  size="sm"
                  className="flex-1"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" /> Generate
                    </>
                  )}
                </FancyButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({
  report, onGenerate, onQuickDownload, downloading, onEdit, onDelete,
}: {
  report: Report;
  onGenerate: (r: Report) => void;
  onQuickDownload: (r: Report) => void;
  downloading: boolean;
  onEdit?: (r: Report) => void;
  onDelete?: (r: Report) => void;
}) {
  const catMeta = CATEGORY_META[report.category];
  const CatIcon =
    report.category === "academic"   ? GraduationCap :
    report.category === "attendance" ? UserCheck :
    report.category === "finance"    ? CreditCard :
    report.category === "custom"     ? Sparkles :
    Users;

  return (
    <div className="h-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">

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
        {report.isCustom && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => onEdit?.(report)}
              title="Edit report"
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete?.(report)}
              title="Delete report"
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
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
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
          <Calendar className="h-3 w-3 shrink-0" />
          {report.lastGenerated ? (
            <span>Last: {formatDate(report.lastGenerated)}</span>
          ) : (
            <span className="text-amber-500 dark:text-amber-400 font-medium">Never generated</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQuickDownload(report)}
            disabled={downloading}
            title="Quick download (default date range)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onGenerate(report)}
            className="flex h-7 items-center gap-1 rounded-lg bg-primary-500 hover:bg-primary-600 px-2.5 text-[11px] font-semibold text-white transition-colors"
          >
            <Zap className="h-3 w-3" /> Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedules view ────────────────────────────────────────────────────────────

function SchedulesView({
  reports, onGenerate, onQuickDownload, quickDownloadingId, onEdit, onDelete,
}: {
  reports: Report[];
  onGenerate: (r: Report) => void;
  onQuickDownload: (r: Report) => void;
  quickDownloadingId: number | string | null;
  onEdit: (r: Report) => void;
  onDelete: (r: Report) => void;
}) {
  const scheduled = reports.filter((r) => r.isScheduled);

  if (scheduled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
        <Repeat className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No scheduled reports</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">Reports marked as scheduled will show up here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {scheduled.map((r) => (
        <ReportCard
          key={r.id}
          report={r}
          onGenerate={onGenerate}
          onQuickDownload={onQuickDownload}
          downloading={quickDownloadingId === r.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// ── Recent reports table ──────────────────────────────────────────────────────

function RecentReports({ recentReports }: { recentReports: RecentReport[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const catIcon = (cat: ReportCategory) => {
    const Icon =
      cat === "academic"   ? GraduationCap :
      cat === "attendance" ? UserCheck :
      cat === "finance"    ? CreditCard :
      cat === "custom"     ? Sparkles :
      Users;
    return Icon;
  };

  function exportLog() {
    downloadCsv("reports-log", {
      columns: ["Report", "Category", "Format", "Generated At", "By", "Size (KB)"],
      rows: recentReports.map((r) => [r.reportName, CATEGORY_META[r.category].label, r.format.toUpperCase(), formatDateTime(r.generatedAt), r.generatedBy, r.sizeKb]),
    });
  }

  function downloadRow(r: RecentReport) {
    setDownloadingId(r.id);
    startTransition(async () => {
      const result = await downloadRecentReport(r.id);
      if (result) await downloadReportTable(result.reportName, result.table, r.format);
      setDownloadingId(null);
    });
  }

  return (
    <Table
      header={
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Recent Reports</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Last 8 generated reports</p>
          </div>
          <button
            onClick={exportLog}
            disabled={recentReports.length === 0}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export Log
          </button>
        </div>
      }
    >
      <TableHead>
        <Th position="first">Report</Th>
        <Th>Category</Th>
        <Th>Format</Th>
        <Th>Generated At</Th>
        <Th>By</Th>
        <Th>Size</Th>
        <Th position="last"></Th>
      </TableHead>
      <TableBody>
        {recentReports.length === 0 ? (
          <TableEmptyRow colSpan={7} message="No reports generated yet" />
        ) : recentReports.map((r) => {
          const catMeta = CATEGORY_META[r.category];
          const Icon    = catIcon(r.category);
          const rowDownloading = isPending && downloadingId === r.id;
          return (
            <Tr key={r.id}>
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${catMeta.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${catMeta.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                    {r.reportName}
                  </span>
                </div>
              </Td>
              <Td>
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${catMeta.color}`}>
                  {catMeta.label}
                </span>
              </Td>
              <Td>
                <FormatBadge fmt={r.format} />
              </Td>
              <Td className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                {formatDateTime(r.generatedAt)}
              </Td>
              <Td className="text-xs text-gray-500 dark:text-zinc-400">
                {r.generatedBy}
              </Td>
              <Td className="text-xs tabular-nums text-gray-500 dark:text-zinc-400">
                {r.sizeKb} KB
              </Td>
              <Td position="last">
                <button
                  onClick={() => downloadRow(r)}
                  disabled={rowDownloading}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {rowDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Download
                </button>
              </Td>
            </Tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsClient({
  reports, recentReports,
}: {
  reports: Report[];
  recentReports: RecentReport[];
}) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [tab,     setTab]     = useState<Tab>("all");
  const [query,   setQuery]   = useState("");
  const [modal,   setModal]   = useState<Report | null>(null);
  const [quickDownloadingId, setQuickDownloadingId] = useState<number | string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [builderModal, setBuilderModal] = useState<{ open: boolean; editing: CustomReportEditTarget | null; defaultScheduled?: boolean }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function openCreateBuilder() {
    setBuilderModal({ open: true, editing: null });
  }

  function openCreateScheduledBuilder() {
    setBuilderModal({ open: true, editing: null, defaultScheduled: true });
  }

  function openEditBuilder(r: Report) {
    if (!r.builderDef) return;
    setBuilderModal({
      open: true,
      editing: {
        id: String(r.id),
        name: r.name,
        description: r.description,
        def: r.builderDef,
        isScheduled: !!r.isScheduled,
        scheduleLabel: r.scheduleLabel ?? "",
      },
    });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomReport(String(deleteTarget.id));
      setDeleteTarget(null);
      refresh();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return reports.filter((r) => {
      const matchTab  = tab === "all" || r.category === tab;
      const matchQ    = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [reports, tab, query]);

  const hasFilter = query || tab !== "all";

  function refresh() {
    router.refresh();
  }

  function quickDownload(report: Report) {
    setQuickDownloadingId(report.id);
    startTransition(async () => {
      const table = await generateReport({
        reportId: report.id, reportName: report.name, category: report.category,
        format: report.formats[0], dateFrom: DEFAULT_FROM, dateTo: DEFAULT_TO,
      });
      await downloadReportTable(report.name, table, report.formats[0]);
      setQuickDownloadingId(null);
      refresh();
    });
  }

  async function downloadAll() {
    setDownloadingAll(true);
    for (const report of filtered) {
      const table = await generateReport({
        reportId: report.id, reportName: report.name, category: report.category,
        format: report.formats[0], dateFrom: DEFAULT_FROM, dateTo: DEFAULT_TO,
      });
      await downloadReportTable(report.name, table, report.formats[0]);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    setDownloadingAll(false);
    refresh();
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Reports</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Analytics and summaries</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button
            onClick={openCreateScheduledBuilder}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
          >
            <Repeat className="h-3.5 w-3.5" /> Schedule Report
          </button>
          {mainTab === "overview" && (
            <FancyButton size="sm" onClick={downloadAll} disabled={downloadingAll || filtered.length === 0}>
              {downloadingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloadingAll ? "Downloading…" : "Download All"}
            </FancyButton>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsRow reports={reports} recentReports={recentReports} />

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {MAIN_TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMainTab(value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              mainTab === value
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {value === "schedules" && reports.filter((r) => r.isScheduled).length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500/15 px-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {reports.filter((r) => r.isScheduled).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {mainTab === "overview" && (
        <>

          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reports…"
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-8 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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

            {/* Tabs */}
            <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit overflow-x-auto">
              {TABS.map(({ value, label, icon: Icon }) => {
                const count = value === "all"
                  ? reports.length
                  : reports.filter((r) => r.category === value).length;
                return (
                  <button
                    key={value}
                    onClick={() => { setTab(value); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      tab === value
                        ? "bg-primary-500 text-white shadow-sm"
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

            <button
              onClick={openCreateBuilder}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" /> Create Custom Report
            </button>

            {hasFilter && (
              <button
                onClick={() => { setTab("all"); setQuery(""); }}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
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
                <ReportCard
                  key={r.id}
                  report={r}
                  onGenerate={setModal}
                  onQuickDownload={quickDownload}
                  downloading={quickDownloadingId === r.id}
                  onEdit={openEditBuilder}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {mainTab === "downloads" && <RecentReports recentReports={recentReports} />}

      {mainTab === "schedules" && (
        <SchedulesView
          reports={reports}
          onGenerate={setModal}
          onQuickDownload={quickDownload}
          quickDownloadingId={quickDownloadingId}
          onEdit={openEditBuilder}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Generate modal */}
      {modal && (
        <GenerateModal report={modal} onClose={() => setModal(null)} onGenerated={refresh} />
      )}

      {/* Custom report builder */}
      <CustomReportBuilderModal
        open={builderModal.open}
        editing={builderModal.editing}
        defaultScheduled={builderModal.defaultScheduled}
        onClose={() => setBuilderModal({ open: false, editing: null })}
        onSaved={refresh}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Delete &ldquo;{deleteTarget.name}&rdquo;?</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">This can&rsquo;t be undone. Past downloads of this report stay in your log.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
