"use client";

import { useState } from "react";
import Link from "next/link";
import { Receipt, CheckCircle2, Clock, XCircle, Search, ChevronDown, Download, Eye } from "lucide-react";
import { STATUS_BADGE, STATUS_LABEL, formatCurrency, formatDate, type InvoiceStatus } from "@/app/dashboard/billing/_data/billing";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmptyRow } from "@/components/ui/data-table";

export interface PlatformInvoice {
  id: string;
  schoolName: string;
  invoiceNo: string;
  period: string;
  plan: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{value}</p>
        <p className="text-sm text-primary-600 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

export default function InvoicesClient({ invoices }: { invoices: PlatformInvoice[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");

  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const failedCount = invoices.filter((i) => i.status === "failed").length;

  const stats = [
    { label: "Revenue collected", value: formatCurrency(paidTotal), icon: Receipt,      color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Paid invoices",     value: String(paidCount),         icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500" },
    { label: "Pending",           value: String(pendingCount),      icon: Clock,        color: "bg-amber-500/15 text-amber-500" },
    { label: "Failed",            value: String(failedCount),       icon: XCircle,      color: "bg-red-500/15 text-red-500" },
  ];

  const filtered = invoices.filter((i) => {
    const q = query.toLowerCase();
    const matchQ = !q || i.schoolName.toLowerCase().includes(q) || i.invoiceNo.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchQ && matchStatus;
  });

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by institution or invoice no…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | InvoiceStatus)}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Invoice</Th>
          <Th>Institution</Th>
          <Th>Plan</Th>
          <Th>Period</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Issued</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={8} message="No invoices match your filters." />
          ) : (
            filtered.map((inv) => (
              <Tr key={inv.id}>
                <Td position="first" className="text-sm font-medium text-gray-900 dark:text-zinc-50">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="hover:underline hover:text-primary-600 dark:hover:text-primary-400">
                    {inv.invoiceNo}
                  </Link>
                </Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300">{inv.schoolName}</Td>
                <Td className="text-sm text-primary-600 dark:text-zinc-400">{inv.plan}</Td>
                <Td className="text-sm text-primary-600 dark:text-zinc-400">{inv.period}</Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300">{formatCurrency(inv.amount)}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                    {STATUS_LABEL[inv.status]}
                  </span>
                </Td>
                <Td className="text-sm text-primary-500 dark:text-zinc-500">{formatDate(inv.issuedDate)}</Td>
                <Td position="last" align="right">
                  <Link
                    href={`/dashboard/invoices/${inv.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors whitespace-nowrap"
                  >
                    <Eye className="h-3 w-3" /> View
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
