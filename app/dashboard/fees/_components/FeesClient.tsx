"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard, TrendingUp, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, Search, Download,
  Wallet, X, Settings2, SlidersHorizontal, Banknote,
  ArrowUpDown, ArrowUp, ArrowDown, Check,
} from "lucide-react";
import {
  STATUS_LABEL, STATUS_BADGE, CLASS_NUMBERS,
  formatCurrency, formatMonth, avatarColor,
  buildMonthlyRecord,
  type FeeStudent, type FeePaymentRow, type MonthlyFeeRecord,
} from "../_data/fees";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

// ── Month navigation ──────────────────────────────────────────────────────────

export function MonthNav({
  months, index, onChange,
}: {
  months: string[];
  index: number;
  onChange: (i: number) => void;
}) {
  const monthStr = months[index] ?? "";
  const isFirst = index <= 0;
  const isLast = index >= months.length - 1;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(index - 1)}
        disabled={isFirst}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{monthStr ? formatMonth(monthStr) : "No data"}</span>
        {isLast && monthStr && (
          <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>
        )}
      </div>

      <button
        onClick={() => onChange(index + 1)}
        disabled={isLast}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ records, activeCount }: { records: MonthlyFeeRecord[]; activeCount: number }) {
  const totalDue  = records.reduce((s, r) => s + r.totalDue, 0);
  const totalPaid = records.reduce((s, r) => s + r.totalPaid, 0);
  const pending   = totalDue - totalPaid;
  const overdueN  = records.filter((r) => r.status === "overdue").length;
  const paidN     = records.filter((r) => r.status === "paid").length;
  const rate      = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  const items = [
    { label: "Total Due",    value: formatCurrency(totalDue),  icon: CreditCard,   accent: "text-indigo-500  bg-indigo-500/10",  sub: `${activeCount} students` },
    { label: "Collected",    value: formatCurrency(totalPaid), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10", sub: `${paidN} fully paid` },
    { label: "Pending",      value: formatCurrency(pending),   icon: Wallet,       accent: "text-amber-500   bg-amber-500/10",   sub: `${overdueN} overdue` },
    { label: "Collection %", value: `${rate}%`,                icon: TrendingUp,   accent: "text-blue-500    bg-blue-500/10",    sub: rate < 80 ? "Below target" : "On track" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 leading-tight">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Fee table (list view) ─────────────────────────────────────────────────────

const FEE_PAGE_SIZE = 10;

type FeeSortKey = "name" | "class" | "month" | "due" | "paid" | "balance" | "status";
const FEE_SORT_OPTIONS: { key: FeeSortKey; label: string }[] = [
  { key: "name",    label: "Student Name" },
  { key: "class",   label: "Class" },
  { key: "month",   label: "Month" },
  { key: "due",     label: "Amount Due" },
  { key: "paid",    label: "Paid" },
  { key: "balance", label: "Balance" },
  { key: "status",  label: "Status" },
];

function FeeSortMenu({
  sortBy, sortDir, open, onToggle, onKeyChange, onDirChange,
}: {
  sortBy: FeeSortKey; sortDir: "asc" | "desc"; open: boolean;
  onToggle: () => void; onKeyChange: (key: FeeSortKey) => void; onDirChange: (dir: "asc" | "desc") => void;
}) {
  const activeLabel = FEE_SORT_OPTIONS.find((o) => o.key === sortBy)?.label;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
      >
        <ArrowUpDown className="h-3.5 w-3.5" /> Sort: {activeLabel}
        {sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10">
            {FEE_SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => onKeyChange(o.key)}
                className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
              >
                <span className="truncate">{o.label}</span>
                {o.key === sortBy && <Check className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-zinc-700/50" />
            <div className="flex items-center gap-1.5 p-1.5">
              <button
                onClick={() => onDirChange("asc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "asc" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowUp className="h-3 w-3 shrink-0" /> Ascending
              </button>
              <button
                onClick={() => onDirChange("desc")}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${sortDir === "desc" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60"}`}
              >
                <ArrowDown className="h-3 w-3 shrink-0" /> Descending
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FeeTable({
  records, months, monthFilter, onMonthFilterChange,
}: {
  records: { student: FeeStudent; record: MonthlyFeeRecord }[];
  months: string[];
  monthFilter: string; // "all" | a monthStr
  onMonthFilterChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClass] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<FeeSortKey>("month");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const rows = records.filter(({ student, record }) => {
      const matchQ  = !q || student.name.toLowerCase().includes(q) || student.rollNo.includes(q) || student.parent.toLowerCase().includes(q);
      const matchCl = classFilter  === "all" || student.classNum === classFilter;
      const matchSt = statusFilter === "all" || record.status === statusFilter;
      const matchMo = monthFilter === "all" || record.monthStr === monthFilter;
      return matchQ && matchCl && matchSt && matchMo;
    });
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name")    cmp = a.student.name.localeCompare(b.student.name);
      if (sortBy === "class")   cmp = Number(a.student.classNum) - Number(b.student.classNum) || a.student.section.localeCompare(b.student.section);
      if (sortBy === "month")   cmp = a.record.monthStr.localeCompare(b.record.monthStr) || a.student.name.localeCompare(b.student.name);
      if (sortBy === "due")     cmp = a.record.totalDue - b.record.totalDue;
      if (sortBy === "paid")    cmp = a.record.totalPaid - b.record.totalPaid;
      if (sortBy === "balance") cmp = a.record.balance - b.record.balance;
      if (sortBy === "status")  cmp = a.record.status.localeCompare(b.record.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [records, query, classFilter, statusFilter, monthFilter, sortBy, sortDir]);

  const activeFilterCount = [classFilter, statusFilter, monthFilter].filter((v) => v !== "all").length;
  const hasFilter = Boolean(query) || activeFilterCount > 0;

  const totalPages = Math.max(1, Math.ceil(filtered.length / FEE_PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * FEE_PAGE_SIZE, page * FEE_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search student, roll no or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <FeeSortMenu
          sortBy={sortBy}
          sortDir={sortDir}
          open={sortOpen}
          onToggle={() => setSortOpen((v) => !v)}
          onKeyChange={(key) => { setSortBy(key); setSortOpen(false); }}
          onDirChange={(dir) => { setSortDir(dir); setSortOpen(false); }}
        />

        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 space-y-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-lg shadow-black/10">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Month</label>
                  <div className="relative">
                    <select
                      value={monthFilter}
                      onChange={(e) => { onMonthFilterChange(e.target.value); setPage(1); }}
                      className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Months</option>
                      {[...months].reverse().map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class</label>
                  <div className="relative">
                    <select
                      value={classFilter}
                      onChange={(e) => { setClass(e.target.value); setPage(1); }}
                      className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Classes</option>
                      {CLASS_NUMBERS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                      className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">{STATUS_LABEL.paid}</option>
                      <option value="partial">{STATUS_LABEL.partial}</option>
                      <option value="overdue">{STATUS_LABEL.overdue}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { onMonthFilterChange("all"); setClass("all"); setStatus("all"); setPage(1); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear all filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {hasFilter && (
          <button
            onClick={() => { setQuery(""); onMonthFilterChange("all"); setClass("all"); setStatus("all"); setPage(1); }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <Table
        footer={
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-zinc-700/50">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length === 0 ? 0 : (page - 1) * FEE_PAGE_SIZE + 1}-{Math.min(page * FEE_PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> fee records
              {hasFilter && <span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">· Filters active</span>}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | "…")[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(n); return acc;
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}
                      >
                        {n}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        }
      >
        <TableHead>
          <Th position="first">Student</Th>
          <Th>Class</Th>
          <Th>Month</Th>
          <Th>Amount Due</Th>
          <Th>Paid</Th>
          <Th>Balance</Th>
          <Th>Status</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={8} message="No fee records match this filter" />
          ) : pageData.map(({ student, record }) => (
            <Tr
              key={`${student.id}|${record.monthStr}`}
              className={record.status === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}
            >
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(student.id)}`}>
                    {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{student.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{student.rollNo}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="inline-flex h-6 items-center justify-center rounded-md bg-primary-500/10 px-2 text-xs font-bold text-primary-600 dark:text-primary-400">
                  {student.classNum}-{student.section}
                </span>
              </Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                {formatMonth(record.monthStr)}
              </Td>
              <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                {formatCurrency(record.totalDue)}
              </Td>
              <Td className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(record.totalPaid)}
              </Td>
              <Td className={`text-sm font-semibold tabular-nums ${record.balance > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-zinc-600"}`}>
                {formatCurrency(record.balance)}
              </Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
                  {STATUS_LABEL[record.status]}
                </span>
              </Td>
              <Td position="last" align="right">
                <Link
                  href={`/dashboard/fees/${student.id}?month=${record.monthStr}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors"
                >
                  View
                </Link>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function exportFeesCsv(label: string, records: { student: FeeStudent; record: MonthlyFeeRecord }[]) {
  const header = ["Student", "Roll No", "Class", "Section", "Month", "Amount Due", "Amount Paid", "Balance", "Status"];
  const lines = records.map(({ student, record }) => [
    student.name, student.rollNo, student.classNum, student.section, formatMonth(record.monthStr),
    record.totalDue, record.totalPaid, record.balance, STATUS_LABEL[record.status],
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fees-${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FeesClient({
  students, payments,
}: {
  students: FeeStudent[];
  payments: FeePaymentRow[];
}) {
  const months = useMemo(() => Array.from(new Set(payments.map((p) => p.monthStr))).sort(), [payments]);
  const [monthFilter, setMonthFilter] = useState<string>("all"); // "all" | a monthStr

  const activeStudents = useMemo(() => students.filter((s) => s.active), [students]);

  const paymentsByStudentMonth = useMemo(() => {
    const map = new Map<string, FeePaymentRow[]>();
    for (const p of payments) {
      const key = `${p.studentId}|${p.monthStr}`;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [payments]);

  // Every generated fee record across every month, for every active student —
  // the flat list the table filters/sorts/paginates on.
  const allRecords = useMemo(() => {
    const rows: { student: FeeStudent; record: MonthlyFeeRecord }[] = [];
    for (const student of activeStudents) {
      for (const m of months) {
        const rows_ = paymentsByStudentMonth.get(`${student.id}|${m}`);
        if (!rows_ || rows_.length === 0) continue;
        rows.push({ student, record: buildMonthlyRecord(student.id, m, rows_) });
      }
    }
    return rows;
  }, [activeStudents, months, paymentsByStudentMonth]);

  // Stats mirror whatever scope is selected: every generated record when
  // viewing "All Months", or a per-student snapshot for one specific month
  // (including students with no record that month, shown as ₹0 due).
  const monthRecords = useMemo(() => {
    if (monthFilter === "all") return allRecords.map((r) => r.record);
    return activeStudents.map((s) => buildMonthlyRecord(s.id, monthFilter, paymentsByStudentMonth.get(`${s.id}|${monthFilter}`) ?? []));
  }, [monthFilter, allRecords, activeStudents, paymentsByStudentMonth]);

  const exportRecords = useMemo(() => {
    if (monthFilter === "all") return allRecords;
    return activeStudents.map((s) => ({ student: s, record: buildMonthlyRecord(s.id, monthFilter, paymentsByStudentMonth.get(`${s.id}|${monthFilter}`) ?? []) }));
  }, [monthFilter, allRecords, activeStudents, paymentsByStudentMonth]);

  return (
    <div className="w-full px-6 py-6 space-y-5">

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Fees</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Fee collection and tracking</p>
        </div>
        <div className="flex gap-2 sm:ml-auto items-center flex-wrap">
          {months.length > 0 && (
            <button
              onClick={() => exportFeesCsv(monthFilter === "all" ? "all-months" : monthFilter, exportRecords)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          )}
          <Link
            href="/dashboard/fees/structure"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" /> Fee Structure
          </Link>
          <FancyButton href="/dashboard/fees/collect" size="sm">
            <Banknote className="h-4 w-4" /> Collect Fees
          </FancyButton>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <AlertCircle className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No fee records found yet.</p>
          <FancyButton
            href="/dashboard/fees/structure"
            size="sm"
          >
            <Settings2 className="h-3.5 w-3.5" /> Set Up Fee Structure
          </FancyButton>
        </div>
      ) : (
        <>
          <StatsRow records={monthRecords} activeCount={activeStudents.length} />

          <FeeTable
            records={allRecords}
            months={months}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
          />
        </>
      )}
    </div>
  );
}
