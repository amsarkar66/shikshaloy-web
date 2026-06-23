"use client";

import { useState } from "react";
import {
  CreditCard, CheckCircle2, Clock, Download, AlertTriangle,
  Landmark, Zap, Building2, ChevronRight, Star,
  Receipt, ArrowUpRight, Shield, Headphones, BarChart3,
  Users, Wifi, Package,
} from "lucide-react";

// ── Mock data ─────────────────────────────────────────────────────────────────

const CURRENT_PLAN = "institution_pro";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: 4000,
    schools: 1,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    activeColor: "border-sky-500 ring-2 ring-sky-500/20",
    features: ["1 school", "Up to 500 students", "Basic fee management", "Attendance tracking", "Email support"],
    unavailable: ["Analytics & reports", "Multi-school management", "Priority support", "Custom integrations"],
  },
  {
    id: "growth",
    name: "Growth",
    icon: BarChart3,
    price: 8000,
    schools: 3,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    activeColor: "border-blue-500 ring-2 ring-blue-500/20",
    features: ["Up to 3 schools", "Up to 2,000 students", "Full fee management", "Analytics & reports", "Chat support"],
    unavailable: ["Multi-school management", "Priority support", "Custom integrations"],
  },
  {
    id: "institution_pro",
    name: "Institution Pro",
    icon: Building2,
    price: 12000,
    schools: 5,
    badge: "Current plan",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    activeColor: "border-violet-500 ring-2 ring-violet-500/20",
    features: [
      "Up to 5 schools",
      "Unlimited students",
      "Full fee & payroll",
      "Analytics & reports",
      "Priority support",
      "Multi-school management",
    ],
    unavailable: ["Custom integrations"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Landmark,
    price: null,
    schools: null,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    activeColor: "border-indigo-500 ring-2 ring-indigo-500/20",
    features: [
      "Unlimited schools",
      "Unlimited students",
      "All Pro features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    unavailable: [],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

type InvoiceStatus = "paid" | "pending" | "failed";

const INVOICES: {
  id: string;
  date: string;
  period: string;
  amount: number;
  plan: string;
  status: InvoiceStatus;
}[] = [
  { id: "INV-2026-06", date: "2026-06-01", period: "June 2026",      amount: 12000, plan: "Institution Pro", status: "paid"    },
  { id: "INV-2026-05", date: "2026-05-01", period: "May 2026",       amount: 12000, plan: "Institution Pro", status: "paid"    },
  { id: "INV-2026-04", date: "2026-04-01", period: "April 2026",     amount: 12000, plan: "Institution Pro", status: "paid"    },
  { id: "INV-2026-03", date: "2026-03-01", period: "March 2026",     amount: 12000, plan: "Institution Pro", status: "paid"    },
  { id: "INV-2026-02", date: "2026-02-01", period: "February 2026",  amount: 12000, plan: "Institution Pro", status: "paid"    },
  { id: "INV-2026-01", date: "2026-01-01", period: "January 2026",   amount:  8000, plan: "Growth",          status: "paid"    },
];

const PAYMENT_METHOD = {
  brand: "Visa",
  last4: "4242",
  expiry: "09/28",
  name: "Subrata Roy",
};

const SUBSCRIPTION = {
  plan: "Institution Pro",
  status: "active" as const,
  schools: 3,
  maxSchools: 5,
  renewsOn: "15 Jan 2027",
  monthlyFee: 12000,
  nextInvoice: "2026-07-01",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/20   bg-amber-500/10   text-amber-600   dark:text-amber-400",
  failed:  "border-red-500/20     bg-red-500/10     text-red-600     dark:text-red-400",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid", pending: "Pending", failed: "Failed",
};

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const usedPct = Math.round((SUBSCRIPTION.schools / SUBSCRIPTION.maxSchools) * 100);

  const items = [
    {
      label: "Current Plan",
      value: SUBSCRIPTION.plan,
      sub: "Active subscription",
      icon: Shield,
      accent: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Monthly Cost",
      value: formatCurrency(SUBSCRIPTION.monthlyFee),
      sub: "Billed monthly",
      icon: CreditCard,
      accent: "text-indigo-500 bg-indigo-500/10",
    },
    {
      label: "Next Renewal",
      value: SUBSCRIPTION.renewsOn,
      sub: `Invoice due ${formatDate(SUBSCRIPTION.nextInvoice)}`,
      icon: Clock,
      accent: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Schools Used",
      value: `${SUBSCRIPTION.schools} / ${SUBSCRIPTION.maxSchools}`,
      sub: `${usedPct}% capacity`,
      icon: Building2,
      accent: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4"
        >
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
  plan,
  isCurrent,
  onSelect,
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

      {/* Header */}
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

      {/* Features */}
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

      {/* CTA */}
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

function PaymentMethodCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Payment Method</p>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          Update <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Card visual */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-md shadow-indigo-500/20 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-widest opacity-80">{PAYMENT_METHOD.brand}</span>
        </div>
        <p className="font-mono text-base tracking-widest">
          •••• •••• •••• {PAYMENT_METHOD.last4}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs opacity-75">
          <span>{PAYMENT_METHOD.name}</span>
          <span>Expires {PAYMENT_METHOD.expiry}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
        <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        Payments secured by 256-bit SSL encryption
      </div>
    </div>
  );
}

// ── Support & add-ons ─────────────────────────────────────────────────────────

const FEATURES_INCLUDED = [
  { icon: Headphones, label: "Priority support",     sub: "Response within 4 hrs"        },
  { icon: Wifi,       label: "99.9% uptime SLA",     sub: "Guaranteed availability"       },
  { icon: Users,      label: "Multi-school mgmt",    sub: "Centralised control panel"     },
  { icon: Package,    label: "Automated backups",    sub: "Daily snapshots, 30-day retain" },
];

function IncludedFeaturesCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Included with Institution Pro</p>
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

function CancelBanner() {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-500/5 p-4 flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Cancel subscription</p>
        <p className="text-[11px] text-red-500 dark:text-red-500/80 mt-0.5">
          All school data will be retained for 30 days after cancellation.
        </p>
      </div>
      <button className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap">
        Cancel plan
      </button>
    </div>
  );
}

// ── Invoice table ─────────────────────────────────────────────────────────────

function InvoiceTable() {
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
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {INVOICES.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Receipt className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-mono text-xs text-gray-700 dark:text-zinc-300">{inv.id}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                  {inv.period}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                    {inv.plan}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">
                  {formatCurrency(inv.amount)}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>
                    {STATUS_LABEL[inv.status]}
                  </span>
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

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

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
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Subscription active
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Latest invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* Plan upgrade prompt */}
      {selectedPlan && selectedPlan !== CURRENT_PLAN && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-500/5 px-5 py-4 flex items-center gap-3">
          <Zap className="h-4 w-4 shrink-0 text-indigo-500" />
          <p className="flex-1 text-sm text-indigo-700 dark:text-indigo-300">
            You selected <span className="font-semibold">{PLANS.find((p) => p.id === selectedPlan)?.name}</span>.
            Contact us or proceed to confirm the plan change.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-xs font-medium text-indigo-500 hover:underline"
            >
              Cancel
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-xs font-medium text-white transition-colors">
              Confirm change
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
              isCurrent={plan.id === CURRENT_PLAN}
              onSelect={(id) => setSelectedPlan(id)}
            />
          ))}
        </div>
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: invoices */}
        <div className="lg:col-span-2 space-y-6">
          <InvoiceTable />
          <CancelBanner />
        </div>

        {/* Right: payment method + included features */}
        <div className="space-y-5">
          <PaymentMethodCard />
          <IncludedFeaturesCard />
        </div>

      </div>
    </div>
  );
}
