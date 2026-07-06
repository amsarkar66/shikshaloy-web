"use client";

import { useState, useTransition } from "react";
import {
  CreditCard, CheckCircle2, Clock, Download, AlertTriangle,
  ChevronRight, Star,
  Receipt, ArrowUpRight, Shield, Headphones, Wifi,
  Users, Package, Zap, Building2,
} from "lucide-react";
import {
  PLANS, STATUS_BADGE, STATUS_LABEL, formatCurrency, formatDate,
  type PlanId, type Subscription, type Invoice,
} from "../_data/billing";
import { changePlan, cancelSubscription } from "../actions";

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ subscription }: { subscription: Subscription }) {
  const usedPct = subscription.maxSchools ? Math.round((subscription.schoolsUsed / subscription.maxSchools) * 100) : 0;

  const items = [
    { label: "Current Plan",   value: subscription.planName,                    sub: subscription.status === "active" ? "Active subscription" : subscription.status, icon: Shield,     accent: "text-violet-500 bg-violet-500/10" },
    { label: "Monthly Cost",   value: formatCurrency(subscription.monthlyFee),  sub: "Billed monthly",                                                                icon: CreditCard, accent: "text-indigo-500 bg-indigo-500/10" },
    { label: "Next Renewal",   value: formatDate(subscription.renewsOn),        sub: "Auto-renews",                                                                   icon: Clock,      accent: "text-blue-500 bg-blue-500/10" },
    { label: "Schools Used",   value: `${subscription.schoolsUsed} / ${subscription.maxSchools}`, sub: `${usedPct}% capacity`,                                        icon: Building2,  accent: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-zinc-50 leading-tight truncate">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan, isCurrent, onSelect,
}: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  onSelect: (id: PlanId) => void;
}) {
  const Icon = plan.icon;
  const isEnterprise = plan.id === "enterprise";

  return (
    <div
      className={`relative rounded-2xl border bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 transition-all ${
        isCurrent
          ? plan.activeColor + " dark:" + plan.activeColor
          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Star className="h-2.5 w-2.5" /> Current plan
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${plan.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{plan.name}</p>
          {plan.price !== null ? (
            <p className="text-lg font-extrabold text-gray-900 dark:text-zinc-50 leading-tight mt-0.5">
              {formatCurrency(plan.price)}
              <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/mo</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">Custom pricing</p>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {f}
          </li>
        ))}
        {plan.unavailable.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-600">
            <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center text-gray-300 dark:text-zinc-700 font-bold">✕</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={isCurrent}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
          isCurrent
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 cursor-default"
            : isEnterprise
            ? "border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
            : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
        }`}
      >
        {isCurrent
          ? "Current plan"
          : isEnterprise
          ? <>Contact sales <ChevronRight className="h-3 w-3" /></>
          : "Switch to this plan"}
      </button>
    </div>
  );
}

// ── Payment method ────────────────────────────────────────────────────────────

function PaymentMethodCard({ summary }: { summary: string | null }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Payment Method</p>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          {summary ? "Update" : "Add"} <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {summary ? (
        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-md shadow-indigo-500/20 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="font-mono text-base tracking-widest">{summary}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-6 mb-4 flex flex-col items-center gap-2 text-center">
          <CreditCard className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No payment method on file</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Add a card to continue automatic billing.</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
        <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        Payments secured by 256-bit SSL encryption
      </div>
    </div>
  );
}

// ── Support & add-ons ─────────────────────────────────────────────────────────

const FEATURES_INCLUDED = [
  { icon: Headphones, label: "Priority support",     sub: "Response within 4 hrs" },
  { icon: Wifi,       label: "99.9% uptime SLA",     sub: "Guaranteed availability" },
  { icon: Users,      label: "Multi-school mgmt",    sub: "Centralised control panel" },
  { icon: Package,    label: "Automated backups",    sub: "Daily snapshots, 30-day retain" },
];

function IncludedFeaturesCard({ planName }: { planName: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Included with {planName}</p>
      <div className="space-y-3">
        {FEATURES_INCLUDED.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <f.icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{f.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cancel banner ─────────────────────────────────────────────────────────────

function CancelBanner({ onCancelled }: { onCancelled: () => void }) {
  const [isPending, startTransition] = useTransition();
  function handleCancel() {
    startTransition(async () => {
      await cancelSubscription();
      onCancelled();
    });
  }
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-500/5 p-4 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Cancel subscription</p>
        <p className="text-[11px] text-red-500 dark:text-red-500/80 mt-0.5">
          All school data will be retained for 30 days after cancellation.
        </p>
      </div>
      <button onClick={handleCancel} disabled={isPending} className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap disabled:opacity-50">
        {isPending ? "Cancelling…" : "Cancel plan"}
      </button>
    </div>
  );
}

// ── Invoice table ─────────────────────────────────────────────────────────────

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Billing History</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">All past invoices and payments</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 h-8 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
            <tr>
              {["Invoice", "Period", "Plan", "Amount", "Status", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">No invoices yet</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Receipt className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-xs text-gray-700 dark:text-zinc-300">{inv.invoiceNo}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{inv.period}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">{inv.plan}</span>
                </td>
                <td className="px-5 py-3 text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">
                    <ArrowUpRight className="h-3 w-3" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingClient({
  subscription, invoices,
}: {
  subscription: Subscription | null;
  invoices: Invoice[];
}) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    window.location.reload();
  }

  function handleConfirmChange() {
    if (!selectedPlan) return;
    startTransition(async () => {
      await changePlan(selectedPlan);
      setSelectedPlan(null);
      refresh();
    });
  }

  if (!subscription) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-20">
        <p className="text-sm text-gray-400 dark:text-zinc-500">No subscription found for this school.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Billing &amp; Subscription</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Manage your Shikshaloy plan, invoices, and payment method
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            subscription.status === "active"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {subscription.status === "active" ? "Subscription active" : subscription.status === "cancelled" ? "Cancelled" : "Past due"}
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Latest invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow subscription={subscription} />

      {/* Plan upgrade prompt */}
      {selectedPlan && selectedPlan !== subscription.planId && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-500/5 px-5 py-4 flex items-center gap-3">
          <Zap className="h-4 w-4 shrink-0 text-indigo-500" />
          <p className="flex-1 text-sm text-indigo-700 dark:text-indigo-300">
            You selected <span className="font-semibold">{PLANS.find((p) => p.id === selectedPlan)?.name}</span>.
            Contact us or proceed to confirm the plan change.
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setSelectedPlan(null)} className="text-xs font-medium text-indigo-500 hover:underline">Cancel</button>
            <button onClick={handleConfirmChange} disabled={isPending} className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-xs font-medium text-white transition-colors disabled:opacity-50">
              {isPending ? "Applying…" : "Confirm change"}
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Plans</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500">All prices in INR, billed monthly</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === subscription.planId}
              onSelect={(id) => setSelectedPlan(id)}
            />
          ))}
        </div>
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceTable invoices={invoices} />
          <CancelBanner onCancelled={refresh} />
        </div>
        <div className="space-y-5">
          <PaymentMethodCard summary={subscription.paymentMethodSummary} />
          <IncludedFeaturesCard planName={subscription.planName} />
        </div>
      </div>
    </div>
  );
}
