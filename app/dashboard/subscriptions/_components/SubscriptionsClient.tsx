"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard, Wallet, AlertTriangle, XCircle, Search, ChevronDown, ShieldAlert,
} from "lucide-react";
import { PLANS } from "@/app/dashboard/billing/_data/billing";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmptyRow } from "@/components/ui/data-table";

export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type InstitutionStatus = "pending" | "active" | "rejected";

export interface PlatformSubscription {
  id: string;
  schoolId: string;
  schoolName: string;
  institutionStatus: InstitutionStatus;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  schoolsUsed: number;
  maxSchools: number;
  monthlyFee: number;
  renewsOn: string;
  paymentMethodSummary: string | null;
  pendingVerification: boolean;
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  past_due:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  cancelled: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Active", past_due: "Past Due", cancelled: "Cancelled",
};

const PLAN_COLOR: Record<string, string> = Object.fromEntries(
  PLANS.map((p) => [p.name, p.color])
);

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

export default function SubscriptionsClient({ subscriptions }: { subscriptions: PlatformSubscription[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SubscriptionStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | string>("all");

  const plans = useMemo(() => Array.from(new Set(subscriptions.map((s) => s.planName))).sort(), [subscriptions]);

  const mrr = subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.monthlyFee, 0);
  const active = subscriptions.filter((s) => s.status === "active").length;
  const pastDue = subscriptions.filter((s) => s.status === "past_due").length;
  const cancelled = subscriptions.filter((s) => s.status === "cancelled").length;
  const pendingVerification = subscriptions.filter((s) => s.pendingVerification).length;

  const stats = [
    { label: "Monthly recurring revenue", value: formatCurrency(mrr), icon: Wallet,       color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Active subscriptions",      value: String(active),      icon: CreditCard,   color: "bg-emerald-500/15 text-emerald-500" },
    { label: "Pending verification",      value: String(pendingVerification), icon: ShieldAlert, color: "bg-amber-500/15 text-amber-500" },
    { label: "Past due",                  value: String(pastDue),     icon: AlertTriangle, color: "bg-amber-500/15 text-amber-500" },
    { label: "Cancelled",                 value: String(cancelled),   icon: XCircle,       color: "bg-red-500/15 text-red-500" },
  ];

  const filtered = subscriptions.filter((s) => {
    const q = query.toLowerCase();
    const matchQ = !q || s.schoolName.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchPlan = planFilter === "all" || s.planName === planFilter;
    return matchQ && matchStatus && matchPlan;
  });

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by institution…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | SubscriptionStatus)}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="all">All plans</option>
            {plans.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Institution</Th>
          <Th>Plan</Th>
          <Th>Status</Th>
          <Th>Schools</Th>
          <Th>Monthly Fee</Th>
          <Th>Renews On</Th>
          <Th position="last">Payment</Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={7} message="No subscriptions match your filters." />
          ) : (
            filtered.map((s) => (
              <Tr key={s.id}>
                <Td position="first" className="text-sm font-medium text-gray-900 dark:text-zinc-50">
                  <Link href={`/dashboard/subscriptions/${s.schoolId}`} className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                    {s.schoolName}
                  </Link>
                </Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PLAN_COLOR[s.planName] ?? "text-gray-500 bg-gray-500/10 border-gray-500/20"}`}>
                    {s.planName}
                  </span>
                </Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </Td>
                <Td className="text-sm text-primary-600 dark:text-zinc-400">{s.schoolsUsed} / {s.maxSchools}</Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300">{formatCurrency(s.monthlyFee)}</Td>
                <Td className="text-sm text-primary-500 dark:text-zinc-500">{formatDate(s.renewsOn)}</Td>
                <Td position="last" className="text-sm text-primary-500 dark:text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>{s.paymentMethodSummary ?? "—"}</span>
                    {s.pendingVerification && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        <ShieldAlert className="h-3 w-3" /> Verify payment
                      </span>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
