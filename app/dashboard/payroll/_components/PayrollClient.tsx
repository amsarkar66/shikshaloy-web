"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Wallet, CheckCircle2, Clock, PauseCircle,
  ChevronLeft, ChevronRight, Search, Download,
  ArrowLeft, Printer, BadgeDollarSign,
  FileText, X,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, formatDate,
  avatarColor, initials, deptColor,
  earningsOf, deductionsOf, totalDeductions,
  type PayrollStaff, type PayrollRecord, type PayrollStatus,
} from "../_data/payroll";
import { processSalary, processAllPending } from "../actions";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow, TableTitleHeader } from "@/components/ui/data-table";

// ── Month nav ─────────────────────────────────────────────────────────────────

function MonthNav({ months, index, onChange }: { months: string[]; index: number; onChange: (i: number) => void }) {
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
        {isLast && monthStr && <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>}
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

// ── Pay slip ──────────────────────────────────────────────────────────────────

function PaySlip({ staff, record, onClose }: { staff: PayrollStaff; record: PayrollRecord; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 print:hidden">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Details
        </button>
        <FancyButton onClick={() => window.print()} size="xs" className="sm:ml-auto">
          <Printer className="h-3.5 w-3.5" /> Print Slip
        </FancyButton>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto">
        <div className="bg-primary-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-extrabold text-white">Shikshaloy School</p>
            <p className="text-primary-200 text-xs mt-0.5">Salary Slip — {formatMonth(record.monthStr)}</p>
          </div>
          {record.slipNo && (
            <div className="text-right hidden sm:block">
              <p className="text-primary-200 text-[10px] uppercase tracking-widest font-semibold">Slip No.</p>
              <p className="text-white text-sm font-bold font-mono">{record.slipNo}</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Employee Name", value: staff.name },
              { label: "Employee ID",   value: staff.employeeId },
              { label: "Designation",   value: staff.designation },
              { label: "Department",    value: staff.department },
              { label: "Pay Period",    value: formatMonth(record.monthStr) },
              { label: "Payment Date",  value: record.paidOn ? formatDate(record.paidOn) : "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">Earnings</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {earningsOf(record).map((e) => (
                      <tr key={e.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300">{e.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-zinc-100 text-right tabular-nums">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100">Gross</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">{formatCurrency(record.gross)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">Deductions</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {deductionsOf(record).map((d) => (
                      <tr key={d.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300">{d.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 text-right tabular-nums">-{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 text-right tabular-nums">-{formatCurrency(totalDeductions(record))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 p-5 flex flex-wrap gap-8 items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Gross Earnings</p>
              <p className="text-xl font-extrabold text-gray-800 dark:text-zinc-200 mt-0.5">{formatCurrency(record.gross)}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">−</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Total Deductions</p>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">{formatCurrency(totalDeductions(record))}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">=</div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">Net Pay</p>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(record.net)}</p>
            </div>
          </div>

          {record.paidOn && (
            <div className="flex gap-6 text-sm text-gray-500 dark:text-zinc-400">
              <span>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300">{formatDate(record.paidOn)}</span></span>
              {record.payMode && <span>via <span className="font-medium capitalize text-gray-700 dark:text-zinc-300">{record.payMode.replace("_", " ")}</span></span>}
            </div>
          )}

          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <div>
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Accountant</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature</p>
            </div>
            <p>Computer-generated slip. · Shikshaloy SMS</p>
            <div className="text-right">
              <p className="font-semibold text-gray-500 dark:text-zinc-400">Principal</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32" />
              <p className="mt-1">Signature &amp; Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff salary detail ───────────────────────────────────────────────────────

function StaffPayDetail({
  staff, months, monthStr, recordsByMonth, onBack,
}: {
  staff: PayrollStaff;
  months: string[];
  monthStr: string;
  recordsByMonth: Map<string, PayrollRecord>;
  onBack: () => void;
}) {
  const record = recordsByMonth.get(monthStr);
  const history = months.map((m) => ({ monthStr: m, record: recordsByMonth.get(m) })).filter((h): h is { monthStr: string; record: PayrollRecord } => Boolean(h.record));

  const [showSlip, setShowSlip] = useState(false);
  const [slipMonth, setSlipMonth] = useState(monthStr);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!record) {
    return (
      <div className="space-y-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Staff
        </button>
        <p className="text-sm text-gray-400 dark:text-zinc-500">No payroll record for this month.</p>
      </div>
    );
  }

  if (showSlip) {
    const slipRecord = recordsByMonth.get(slipMonth) ?? record;
    return <PaySlip staff={staff} record={slipRecord} onClose={() => setShowSlip(false)} />;
  }

  function handleProcess() {
    setError("");
    startTransition(async () => {
      try {
        await processSalary(staff.id, monthStr, new Date().toISOString().slice(0, 10), "bank_transfer");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process salary.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors self-start">
          <ArrowLeft className="h-4 w-4" /> All Staff
        </button>

        <div className="sm:ml-2 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(staff.id)}`}>
            {initials(staff.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{staff.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{staff.designation} · {staff.employeeId}</p>
          </div>
        </div>

        <div className="sm:ml-auto flex gap-2">
          {record.status === "processed" && (
            <button
              onClick={() => { setSlipMonth(monthStr); setShowSlip(true); }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-500/10 px-3 text-xs font-medium text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Pay Slip
            </button>
          )}
          {record.status === "pending" && (
            <button onClick={handleProcess} disabled={isPending} className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-3 text-xs font-medium text-white transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5" /> {isPending ? "Processing…" : "Process Salary"}
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Salary Breakdown — {formatMonth(monthStr)}</p>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[record.status]}`}>
            {STATUS_LABEL[record.status]}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-zinc-700/50">
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Earnings</p>
            <div className="space-y-2">
              {earningsOf(record).map((e) => (
                <div key={e.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">{e.label}</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-zinc-100">Gross Total</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(record.gross)}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Deductions</p>
            <div className="space-y-2">
              {deductionsOf(record).map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">{d.label}</span>
                  <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-zinc-100">Total Deductions</span>
                <span className="text-red-600 dark:text-red-400 tabular-nums">-{formatCurrency(totalDeductions(record))}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 bg-indigo-50 dark:bg-indigo-500/5 border-t border-indigo-100 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">Net Pay</p>
            <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-0.5">{formatCurrency(record.net)}</p>
          </div>
          {record.paidOn && (
            <div className="text-xs text-gray-500 dark:text-zinc-400 text-right">
              <p>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300">{formatDate(record.paidOn)}</span></p>
              {record.payMode && <p className="capitalize mt-0.5">via {record.payMode.replace("_", " ")}</p>}
            </div>
          )}
        </div>
      </div>

      <Table header={<TableTitleHeader title="Payroll History" />}>
        <TableHead>
          <Th position="first">Month</Th>
          <Th>Gross</Th>
          <Th>Deductions</Th>
          <Th>Net Pay</Th>
          <Th>Status</Th>
          <Th position="last">Slip</Th>
        </TableHead>
        <TableBody>
          {history.map(({ monthStr: m, record: r }) => (
            <Tr key={m} className={m === monthStr ? "bg-indigo-50/50 dark:bg-indigo-500/5" : ""}>
              <Td position="first" className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                {formatMonth(m)}{m === monthStr && <span className="ml-2 text-[10px] font-bold text-indigo-500">viewing</span>}
              </Td>
              <Td className="text-sm tabular-nums text-gray-600 dark:text-zinc-400">{formatCurrency(r.gross)}</Td>
              <Td className="text-sm tabular-nums text-red-500 dark:text-red-400">-{formatCurrency(totalDeductions(r))}</Td>
              <Td className="text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{formatCurrency(r.net)}</Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </Td>
              <Td position="last">
                {r.status === "processed" ? (
                  <button onClick={() => { setSlipMonth(m); setShowSlip(true); }} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">
                    <Printer className="h-3 w-3" /> Print
                  </button>
                ) : (
                  <span className="text-xs text-gray-300 dark:text-zinc-600">—</span>
                )}
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Payroll table (list view) ─────────────────────────────────────────────────

function PayrollTable({
  staff, monthStr, recordsByStaffMonth, onViewStaff,
}: {
  staff: PayrollStaff[];
  monthStr: string;
  recordsByStaffMonth: Map<string, PayrollRecord>;
  onViewStaff: (id: string) => void;
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
            <TableEmptyRow colSpan={8} message="No staff match this filter" />
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
                <button onClick={() => onViewStaff(s.id)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">View</button>
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
  staff, records,
}: {
  staff: PayrollStaff[];
  records: PayrollRecord[];
}) {
  const months = useMemo(() => Array.from(new Set(records.map((r) => r.monthStr))).sort(), [records]);
  const [monthIndex, setMonthIndex] = useState(Math.max(0, months.length - 1));
  const [selectedStaffId, setStaff] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const recordsByStaffMonth = useMemo(() => {
    const map = new Map<string, PayrollRecord>();
    for (const r of records) map.set(`${r.staffId}|${r.monthStr}`, r);
    return map;
  }, [records]);

  const monthStr = months[monthIndex] ?? "";
  const monthRecords = useMemo(() => records.filter((r) => r.monthStr === monthStr), [records, monthStr]);
  const selectedStaff = staff.find((s) => s.id === selectedStaffId) ?? null;
  const selectedRecordsByMonth = useMemo(() => {
    const map = new Map<string, PayrollRecord>();
    if (!selectedStaff) return map;
    for (const m of months) {
      const r = recordsByStaffMonth.get(`${selectedStaff.id}|${m}`);
      if (r) map.set(m, r);
    }
    return map;
  }, [selectedStaff, months, recordsByStaffMonth]);

  function handleMonthChange(i: number) {
    setMonthIndex(Math.max(0, Math.min(months.length - 1, i)));
    setStaff(null);
  }

  function handleProcessAll() {
    startTransition(async () => {
      await processAllPending(monthStr);
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
          {months.length > 0 && <MonthNav months={months} index={monthIndex} onChange={handleMonthChange} />}
          <button onClick={exportCsv} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <FancyButton onClick={handleProcessAll} disabled={isPending} size="sm" className="shrink-0">
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
          <StatsRow records={monthRecords} staffCount={staff.filter((s) => s.status !== "inactive").length} />

          {selectedStaff ? (
            <StaffPayDetail
              staff={selectedStaff}
              months={months}
              monthStr={monthStr}
              recordsByMonth={selectedRecordsByMonth}
              onBack={() => setStaff(null)}
            />
          ) : (
            <PayrollTable
              staff={staff}
              monthStr={monthStr}
              recordsByStaffMonth={recordsByStaffMonth}
              onViewStaff={(id) => setStaff(id)}
            />
          )}
        </>
      )}
    </div>
  );
}
