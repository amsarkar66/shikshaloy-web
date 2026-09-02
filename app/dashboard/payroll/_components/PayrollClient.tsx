"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Wallet, CheckCircle2, Clock, PauseCircle,
  Search, Download, BadgeDollarSign, X, ChevronDown, Landmark,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatDate,
  avatarColor, initials, deptColor,
  totalDeductions,
  type PayrollStaff, type PayrollRecord, type PayrollStatus,
} from "../_data/payroll";
import { processAllPending } from "../actions";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import MonthNav from "./MonthNav";

export interface SchoolOption {
  id: string;
  name: string;
}

function SchoolTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
      <Landmark className="h-3 w-3 shrink-0 text-violet-400" />{name}
    </span>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ records, staffCount }: { records: PayrollRecord[]; staffCount: number }) {
  const totalPayroll = records.reduce((a, r) => a + r.gross, 0);
  const processed = records.filter((r) => r.status === "processed");
  const pending = records.filter((r) => r.status === "pending");
  const onHold = records.filter((r) => r.status === "on_hold");
  const totalPaid = processed.reduce((a, r) => a + r.net, 0);

  const items = [
    { label: "Total Payroll", value: formatCurrency(totalPayroll), icon: Wallet,       accent: "text-indigo-500  bg-indigo-500/10",  sub: `${staffCount} staff members` },
    { label: "Disbursed",     value: formatCurrency(totalPaid),    icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10", sub: `${processed.length} processed` },
    { label: "Pending",       value: String(pending.length),       icon: Clock,        accent: "text-amber-500   bg-amber-500/10",   sub: "awaiting processing" },
    { label: "On Hold",       value: String(onHold.length),        icon: PauseCircle,  accent: "text-zinc-500    bg-zinc-500/10",    sub: "staff on leave / inactive" },
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

// ── Payroll table (list view) ─────────────────────────────────────────────────

function PayrollTable({
  staff, monthStr, recordsByStaffMonth, showSchoolColumn,
}: {
  staff: PayrollStaff[];
  monthStr: string;
  recordsByStaffMonth: Map<string, PayrollRecord>;
  showSchoolColumn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setType] = useState<"all" | "teaching" | "non_teaching">("all");
  const [statusFilter, setStatus] = useState<"all" | PayrollStatus>("all");

  const active = useMemo(() => staff.filter((s) => s.status !== "inactive"), [staff]);
  const rows = useMemo(
    () => active
      .map((s) => ({ staff: s, record: recordsByStaffMonth.get(`${s.id}|${monthStr}`) }))
      .filter((r): r is { staff: PayrollStaff; record: PayrollRecord } => Boolean(r.record)),
    [active, monthStr, recordsByStaffMonth]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(({ staff: s, record }) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
      const matchTy = typeFilter === "all" || s.type === typeFilter;
      const matchSt = statusFilter === "all" || record.status === statusFilter;
      return matchQ && matchTy && matchSt;
    });
  }, [rows, query, typeFilter, statusFilter]);

  const hasFilter = query || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, employee ID or department…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "teaching", "non_teaching"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${typeFilter === t ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {t === "all" ? "All" : t === "teaching" ? "Teaching" : "Non-Teaching"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {(["all", "processed", "pending", "on_hold"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${statusFilter === s ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {s === "all" ? "All Status" : STATUS_LABEL[s as PayrollStatus]}
            </button>
          ))}
          {hasFilter && (
            <button onClick={() => { setQuery(""); setType("all"); setStatus("all"); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Table
        footer={
          <div className="border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{active.length}</span> staff
              {hasFilter && <span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">· Filters active</span>}
            </p>
          </div>
        }
      >
        <TableHead>
          <Th position="first">Employee</Th>
          {showSchoolColumn && <Th>School</Th>}
          <Th>Type</Th>
          <Th>Gross</Th>
          <Th>Deductions</Th>
          <Th>Net Pay</Th>
          <Th>Status</Th>
          <Th>Pay Date</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={showSchoolColumn ? 9 : 8} message="No staff match this filter" />
          ) : filtered.map(({ staff: s, record }) => (
            <Tr key={s.id} className={record.status === "on_hold" ? "opacity-60" : ""}>
              <Td position="first">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.name)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{s.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.employeeId}</p>
                  </div>
                </div>
              </Td>
              {showSchoolColumn && <Td><SchoolTag name={s.schoolName ?? "—"} /></Td>}
              <Td>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${deptColor(s.department)}`}>{s.department}</span>
              </Td>
              <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{formatCurrency(record.gross)}</Td>
              <Td className="text-sm tabular-nums text-red-500 dark:text-red-400">-{formatCurrency(totalDeductions(record))}</Td>
              <Td className="text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{formatCurrency(record.net)}</Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>{STATUS_LABEL[record.status]}</span>
              </Td>
              <Td className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{record.paidOn ? formatDate(record.paidOn) : "—"}</Td>
              <Td position="last" align="right">
                <Link href={`/dashboard/payroll/${s.id}?month=${monthStr}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">View</Link>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PayrollClient({
  staff, records, schools = [],
}: {
  staff: PayrollStaff[];
  records: PayrollRecord[];
  schools?: SchoolOption[];
}) {
  const months = useMemo(() => Array.from(new Set(records.map((r) => r.monthStr))).sort(), [records]);
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.length - 1));
  const [isPending, startTransition] = useTransition();
  const [schoolFilter, setSchoolFilter] = useState("all");

  const visibleStaff = useMemo(
    () => schoolFilter === "all" ? staff : staff.filter((s) => s.schoolId === schoolFilter),
    [staff, schoolFilter]
  );

  const recordsByStaffMonth = useMemo(() => {
    const map = new Map<string, PayrollRecord>();
    for (const r of records) map.set(`${r.staffId}|${r.monthStr}`, r);
    return map;
  }, [records]);

  const monthStr = months[monthIndex] ?? "";
  const visibleStaffIds = useMemo(() => new Set(visibleStaff.map((s) => s.id)), [visibleStaff]);
  const monthRecords = useMemo(
    () => records.filter((r) => r.monthStr === monthStr && visibleStaffIds.has(r.staffId)),
    [records, monthStr, visibleStaffIds]
  );

  function handleMonthChange(i: number) {
    setMonthIndex(Math.max(0, Math.min(months.length - 1, i)));
  }

  const canProcessAll = schools.length === 0 || schoolFilter !== "all";

  function handleProcessAll() {
    if (!canProcessAll) return;
    startTransition(async () => {
      await processAllPending(monthStr, schoolFilter !== "all" ? schoolFilter : undefined);
    });
  }

  function exportCsv() {
    const staffById = new Map(staff.map((s) => [s.id, s]));
    const header = ["Employee ID", "Name", "Department", "Gross", "Net", "Status", "Paid On"];
    const rows = monthRecords.map((r) => {
      const s = staffById.get(r.staffId);
      return [s?.employeeId ?? "", s?.name ?? "", s?.department ?? "", r.gross, r.net, r.status, r.paidOn ?? ""];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${monthStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Payroll</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Staff salary and payroll processing</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          {schools.length > 0 && (
            <div className="relative">
              <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                <option value="all">All Schools</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          )}
          {months.length > 0 && <MonthNav months={months} index={monthIndex} onChange={handleMonthChange} />}
          <button onClick={exportCsv} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <FancyButton onClick={handleProcessAll} disabled={isPending || !canProcessAll} size="sm" className="shrink-0" title={canProcessAll ? undefined : "Select a specific school to process its payroll"}>
            <BadgeDollarSign className="h-4 w-4" /> {isPending ? "Processing…" : "Process All"}
          </FancyButton>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <Wallet className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No payroll records found yet.</p>
        </div>
      ) : (
        <>
          <StatsRow records={monthRecords} staffCount={visibleStaff.filter((s) => s.status !== "inactive").length} />

          <PayrollTable
            staff={visibleStaff}
            monthStr={monthStr}
            recordsByStaffMonth={recordsByStaffMonth}
            showSchoolColumn={schools.length > 0}
          />
        </>
      )}
    </div>
  );
}
