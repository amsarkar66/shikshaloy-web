"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft, CreditCard, CheckCircle2, Clock, Building2, Receipt,
  ChevronRight, Star, Mail, User, MapPin, ShieldAlert, FileCheck,
  ShieldCheck, ShieldX, Loader2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  PLANS, STATUS_BADGE as INVOICE_STATUS_BADGE, STATUS_LABEL as INVOICE_STATUS_LABEL,
  formatCurrency, formatDate,
  type PlanId, type Subscription, type Invoice, type SubscriptionStatus,
} from "@/app/dashboard/billing/_data/billing";
import { updateSubscriptionPlan, updateSubscriptionStatus, verifyOfflinePayment, rejectOfflinePayment } from "../actions";

type InstitutionStatus = "pending" | "active" | "rejected";

const INSTITUTION_STATUS_BADGE: Record<InstitutionStatus, string> = {
  pending:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

const SUB_STATUS_BADGE: Record<SubscriptionStatus, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  past_due:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  cancelled: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Active", past_due: "Past Due", cancelled: "Cancelled",
};

function StatsRow({ subscription }: { subscription: Subscription }) {
  const usedPct = subscription.maxSchools ? Math.round((subscription.schoolsUsed / subscription.maxSchools) * 100) : 0;

  const items = [
    { label: "Current Plan", value: subscription.planName, sub: SUB_STATUS_LABEL[subscription.status], icon: ShieldAlert, accent: "text-violet-500 bg-violet-500/10" },
    { label: "Monthly Cost", value: formatCurrency(subscription.monthlyFee), sub: "Billed monthly", icon: CreditCard, accent: "text-indigo-500 bg-indigo-500/10" },
    { label: "Next Renewal", value: subscription.renewsOn ? formatDate(subscription.renewsOn) : "—", sub: "Auto-renews", icon: Clock, accent: "text-blue-500 bg-blue-500/10" },
    { label: "Schools Used", value: `${subscription.schoolsUsed} / ${subscription.maxSchools}`, sub: `${usedPct}% capacity`, icon: Building2, accent: "text-emerald-500 bg-emerald-500/10" },
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

function PlanCard({ plan, isCurrent, onSelect }: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  onSelect: (id: PlanId) => void;
}) {
  const Icon = plan.icon;

  return (
    <div
      className={`relative rounded-2xl border bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 transition-all ${
        isCurrent ? plan.activeColor + " dark:" + plan.activeColor : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
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
              {formatCurrency(plan.price)}<span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/mo</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5">Custom pricing</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onSelect(plan.id)}
        disabled={isCurrent || plan.price === null}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors ${
          isCurrent
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 cursor-default"
            : plan.price === null
            ? "border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed"
            : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
        }`}
      >
        {isCurrent ? "Current plan" : plan.price === null ? "Contact sales" : <>Set as plan <ChevronRight className="h-3 w-3" /></>}
      </button>
    </div>
  );
}

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Billing History</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">All invoices issued to this institution</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/50">
            <tr>
              {["Invoice", "Period", "Plan", "Amount", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">No invoices yet</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
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
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingOfflinePaymentsCard({ invoices, onUpdated }: { invoices: Invoice[]; onUpdated: () => void }) {
  const pending = invoices.filter((inv) => inv.status === "pending" && inv.paymentMethod === "offline");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actingId, setActingId] = useState<string | null>(null);

  if (pending.length === 0) return null;

  function handleVerify(id: string) {
    setActingId(id);
    startTransition(async () => {
      await verifyOfflinePayment(id);
      setActingId(null);
      onUpdated();
    });
  }

  function handleReject(id: string) {
    setActingId(id);
    startTransition(async () => {
      await rejectOfflinePayment(id, reason.trim() || undefined);
      setRejectingId(null);
      setReason("");
      setActingId(null);
      onUpdated();
    });
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-500/5 p-5">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
        <FileCheck className="h-4 w-4" /> Pending payment verification
      </p>
      <p className="mb-4 text-xs text-amber-600/80 dark:text-amber-500/70">
        Confirm the reference against your bank/UPI records before verifying.
      </p>
      <div className="space-y-3">
        {pending.map((inv) => (
          <div key={inv.id} className="rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-zinc-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{inv.plan} — {formatCurrency(inv.amount)}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Submitted {formatDate(inv.issuedDate)}</p>
              </div>
              {inv.offlineReceiptUrl && (
                <a href={inv.offlineReceiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                  View receipt
                </a>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-zinc-400">
              <span><span className="text-gray-400 dark:text-zinc-500">Reference:</span> <span className="font-mono">{inv.offlineReference}</span></span>
              {inv.offlineNote && <span><span className="text-gray-400 dark:text-zinc-500">Note:</span> {inv.offlineNote}</span>}
            </div>

            {rejectingId === inv.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for rejection (optional)"
                  className="w-full resize-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setRejectingId(null); setReason(""); }} className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:underline">Never mind</button>
                  <button onClick={() => handleReject(inv.id)} disabled={isPending} className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50">
                    {isPending && actingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldX className="h-3 w-3" />} Confirm reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setRejectingId(inv.id)} disabled={isPending} className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50">
                  Reject
                </button>
                <FancyButton onClick={() => handleVerify(inv.id)} disabled={isPending} size="xs">
                  {isPending && actingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Verify & activate
                </FancyButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageStatusCard({ institutionId, currentStatus, onUpdated }: {
  institutionId: string; currentStatus: SubscriptionStatus; onUpdated: () => void;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleUpdate() {
    startTransition(async () => {
      await updateSubscriptionStatus(institutionId, status);
      onUpdated();
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-zinc-50">Manage subscription</p>
      <p className="mb-4 text-xs text-gray-400 dark:text-zinc-500">Override the billing status for this institution.</p>
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
          className="h-9 flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="active">Active</option>
          <option value="past_due">Past due</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <FancyButton onClick={handleUpdate} disabled={isPending || status === currentStatus} size="xs">
          {isPending ? "Saving…" : "Update"}
        </FancyButton>
      </div>
    </div>
  );
}

export default function SubscriptionDetailClient({
  institutionId, institutionName, institutionStatus, city, state, ownerName, ownerEmail, subscription, invoices,
}: {
  institutionId: string;
  institutionName: string;
  institutionStatus: InstitutionStatus;
  city: string | null;
  state: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
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
      await updateSubscriptionPlan(institutionId, selectedPlan);
      setSelectedPlan(null);
      refresh();
    });
  }

  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div className="w-full px-6 py-8 space-y-6">
      <Link href="/dashboard/subscriptions" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Subscriptions
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">{institutionName}</h1>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${INSTITUTION_STATUS_BADGE[institutionStatus]}`}>
              {institutionStatus}
            </span>
            {subscription && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SUB_STATUS_BADGE[subscription.status]}`}>
                {SUB_STATUS_LABEL[subscription.status]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-500 dark:text-zinc-500">
            {location && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>
            )}
            {ownerName && (
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{ownerName}</span>
            )}
            {ownerEmail && (
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{ownerEmail}</span>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/institutions/${institutionId}`}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          View institution <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!subscription ? (
        <div className="flex h-full items-center justify-center px-6 py-20">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No subscription found for this institution.</p>
        </div>
      ) : (
        <>
          <StatsRow subscription={subscription} />

          {selectedPlan && selectedPlan !== subscription.planId && (
            <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-500/5 px-5 py-4 flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-500" />
              <p className="flex-1 text-sm text-primary-700 dark:text-primary-300">
                Switch this institution to <span className="font-semibold">{PLANS.find((p) => p.id === selectedPlan)?.name}</span>?
              </p>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setSelectedPlan(null)} className="text-xs font-medium text-primary-500 hover:underline">Cancel</button>
                <FancyButton onClick={handleConfirmChange} disabled={isPending} size="xs">
                  {isPending ? "Applying…" : "Confirm change"}
                </FancyButton>
              </div>
            </div>
          )}

          <PendingOfflinePaymentsCard invoices={invoices} onUpdated={refresh} />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Plans</h2>
              <span className="text-xs text-gray-400 dark:text-zinc-500">All prices in INR, billed monthly</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === subscription.planId} onSelect={(id) => setSelectedPlan(id)} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InvoiceTable invoices={invoices} />
            </div>
            <div className="space-y-5">
              <ManageStatusCard institutionId={institutionId} currentStatus={subscription.status} onUpdated={refresh} />
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Payment Method</p>
                {subscription.paymentMethodSummary ? (
                  <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white shadow-md shadow-indigo-500/20">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 mb-6">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <p className="font-mono text-base tracking-widest">{subscription.paymentMethodSummary}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-6 flex flex-col items-center gap-2 text-center">
                    <CreditCard className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No payment method on file</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
