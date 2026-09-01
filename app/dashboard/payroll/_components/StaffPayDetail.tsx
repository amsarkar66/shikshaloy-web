"use client";

import { useEffect } from "react";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  STATUS_LABEL, STATUS_BADGE,
  formatCurrency, formatMonth, formatDate,
  avatarColor, initials,
  earningsOf, deductionsOf, totalDeductions,
  type PayrollStaff, type PayrollRecord,
} from "../_data/payroll";
import { Table, TableHead, TableBody, Th, Td, Tr, TableTitleHeader } from "@/components/ui/data-table";

// ── Pay slip ──────────────────────────────────────────────────────────────────

export function PaySlip({ staff, record, onClose, autoPrint }: { staff: PayrollStaff; record: PayrollRecord; onClose: () => void; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const id = requestAnimationFrame(() => window.print());
    return () => cancelAnimationFrame(id);
  }, [autoPrint, record.staffId, record.monthStr]);

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

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm max-w-2xl mx-auto print:bg-white! print:border-gray-200!">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800 print:border-gray-100!">
            {[
              { label: "Employee Name", value: staff.name },
              { label: "Employee ID",   value: staff.employeeId },
              { label: "Designation",   value: staff.designation },
              { label: "Department",    value: staff.department },
              { label: "Pay Period",    value: formatMonth(record.monthStr) },
              { label: "Payment Date",  value: record.paidOn ? formatDate(record.paidOn) : "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 print:text-gray-400!">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 print:text-gray-900!">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2 print:text-gray-500!">Earnings</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden print:border-gray-200!">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 print:divide-gray-100!">
                    {earningsOf(record).map((e) => (
                      <tr key={e.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 print:text-gray-700!">{e.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-zinc-100 text-right tabular-nums print:text-gray-900!">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700 print:bg-gray-50! print:border-gray-200!">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100 print:text-gray-900!">Gross</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums print:text-emerald-600!">{formatCurrency(record.gross)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2 print:text-gray-500!">Deductions</p>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden print:border-gray-200!">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 print:divide-gray-100!">
                    {deductionsOf(record).map((d) => (
                      <tr key={d.label}>
                        <td className="px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 print:text-gray-700!">{d.label}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 text-right tabular-nums print:text-red-600!">-{formatCurrency(d.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-zinc-800/80 border-t border-gray-200 dark:border-zinc-700 print:bg-gray-50! print:border-gray-200!">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-zinc-100 print:text-gray-900!">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 text-right tabular-nums print:text-red-600!">-{formatCurrency(totalDeductions(record))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 p-5 flex flex-wrap gap-8 items-center print:bg-primary-50! print:border-primary-100!">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500 print:text-indigo-400!">Gross Earnings</p>
              <p className="text-xl font-extrabold text-gray-800 dark:text-zinc-200 mt-0.5 print:text-gray-800!">{formatCurrency(record.gross)}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">−</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500 print:text-indigo-400!">Total Deductions</p>
              <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-0.5 print:text-red-600!">{formatCurrency(totalDeductions(record))}</p>
            </div>
            <div className="text-2xl text-indigo-300 font-light">=</div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500 print:text-indigo-400!">Net Pay</p>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 print:text-indigo-600!">{formatCurrency(record.net)}</p>
            </div>
          </div>

          {record.paidOn && (
            <div className="flex gap-6 text-sm text-gray-500 dark:text-zinc-400 print:text-gray-500!">
              <span>Paid on <span className="font-medium text-gray-700 dark:text-zinc-300 print:text-gray-700!">{formatDate(record.paidOn)}</span></span>
              {record.payMode && <span>via <span className="font-medium capitalize text-gray-700 dark:text-zinc-300 print:text-gray-700!">{record.payMode.replace("_", " ")}</span></span>}
            </div>
          )}

          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4 print:text-gray-400! print:border-gray-100!">
            <div>
              <p className="font-semibold text-gray-500 dark:text-zinc-400 print:text-gray-500!">Accountant</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32 print:border-gray-300!" />
              <p className="mt-1">Signature</p>
            </div>
            <p>Computer-generated slip. · Shikshaloy SMS</p>
            <div className="text-right">
              <p className="font-semibold text-gray-500 dark:text-zinc-400 print:text-gray-500!">Principal</p>
              <div className="mt-6 border-t border-gray-300 dark:border-zinc-700 w-32 print:border-gray-300!" />
              <p className="mt-1">Signature &amp; Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff salary detail ───────────────────────────────────────────────────────

export function StaffPayDetail({
  staff, months, monthStr, recordsByMonth, onBack, backLabel = "All Staff", onPrintMonth,
}: {
  staff: PayrollStaff;
  months: string[];
  monthStr: string;
  recordsByMonth: Map<string, PayrollRecord>;
  onBack: () => void;
  backLabel?: string;
  onPrintMonth: (month: string) => void;
}) {
  const record = recordsByMonth.get(monthStr);
  const history = months.map((m) => ({ monthStr: m, record: recordsByMonth.get(m) })).filter((h): h is { monthStr: string; record: PayrollRecord } => Boolean(h.record));

  if (!record) {
    return (
      <div className="space-y-5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </button>
        <p className="text-sm text-gray-400 dark:text-zinc-500">No payroll record for this month.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(staff.id)}`}>
            {initials(staff.name)}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{staff.name}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{staff.designation} · {staff.employeeId}</p>
          </div>
        </div>
      </div>

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
                  <button onClick={() => onPrintMonth(m)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">
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
