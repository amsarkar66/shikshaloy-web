"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, Download,
  Eye, Calendar,
  Receipt, MoreVertical, Landmark,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  PLANS, STATUS_BADGE, STATUS_LABEL, PAYMENT_METHOD_LABEL, formatCurrency, formatDate,
  type Subscription, type Invoice, type PlanId, type RazorpayMethod,
} from "../_data/billing";
import { PaymentMethodIcon } from "./PaymentMethodIcon";
import { cancelSubscription, cancelOfflinePayment } from "../actions";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ChangePlanModal from "./ChangePlanModal";

// ── Plan usage card ───────────────────────────────────────────────────────────

function capacityColor(pct: number) {
  return pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
}

function UsageMeter({
  label, used, max, unlimitedNote, showUpgrade, onUpgrade,
}: {
  label: string;
  used: number;
  max: number | null;
  unlimitedNote: string;
  showUpgrade: boolean;
  onUpgrade: () => void;
}) {
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const remaining = max !== null ? Math.max(0, max - used) : null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-600 dark:text-zinc-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
          {max !== null ? `${used.toLocaleString("en-IN")} of ${max.toLocaleString("en-IN")}` : `${used.toLocaleString("en-IN")} used`}
        </span>
      </div>
      {max !== null ? (
        <>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-full rounded-full ${capacityColor(pct)}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-gray-400 dark:text-zinc-500">{remaining} remaining</span>
            {showUpgrade && (
              <button onClick={onUpgrade} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Upgrade plan</button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500">{unlimitedNote}</p>
      )}
    </div>
  );
}

function PlanUsageCard({
  subscription, upgradeTarget, onUpgrade,
}: {
  subscription: Subscription;
  upgradeTarget: (typeof PLANS)[number] | null;
  onUpgrade: () => void;
}) {
  const plan = PLANS.find((p) => p.id === subscription.planId);

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Plan usage</p>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">View details of your current plan and usage limits.</p>

      <div className="my-4 h-px bg-gray-100 dark:bg-zinc-800" />

      <div className="space-y-4">
        <UsageMeter
          label="Schools"
          used={subscription.schoolsUsed}
          max={subscription.maxSchools}
          unlimitedNote="Unlimited on this plan"
          showUpgrade={Boolean(upgradeTarget)}
          onUpgrade={onUpgrade}
        />
        <UsageMeter
          label="Students"
          used={subscription.studentsUsed}
          max={plan?.maxStudents ?? null}
          unlimitedNote="Unlimited on this plan"
          showUpgrade={Boolean(upgradeTarget)}
          onUpgrade={onUpgrade}
        />
      </div>
    </div>
  );
}

// ── Pending offline payment banner ──────────────────────────────────────────────

function PendingOfflineBanner({ invoice }: { invoice: Invoice }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await cancelOfflinePayment(invoice.id);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-500/5 px-5 py-4 flex items-center gap-3">
      <Clock className="h-4 w-4 shrink-0 text-amber-500" />
      <p className="flex-1 text-sm text-amber-700 dark:text-amber-400">
        Your offline payment for the <span className="font-semibold">{invoice.plan}</span> plan ({formatCurrency(invoice.amount)}) is awaiting verification — usually within 1 business day.
      </p>
      <div className="flex shrink-0 items-center gap-3">
        {confirming ? (
          <>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80 whitespace-nowrap">Withdraw this request?</span>
            <button onClick={() => setConfirming(false)} className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap">
              Never mind
            </button>
            <button onClick={handleCancel} disabled={isPending} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap disabled:opacity-50">
              {isPending ? "Cancelling…" : "Confirm cancel"}
            </button>
          </>
        ) : (
          <>
            <Link href={`/dashboard/billing/${invoice.id}`} className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap">
              View submission
            </Link>
            <button onClick={handleCancel} className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 hover:text-red-600 dark:hover:text-red-400 transition-colors whitespace-nowrap">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Your plan card ───────────────────────────────────────────────────────────

const PLAN_STATUS_DOT: Record<Subscription["status"], string> = {
  active: "bg-emerald-500", past_due: "bg-amber-500", cancelled: "bg-red-500",
};
const PLAN_STATUS_CHIP: Record<Subscription["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  past_due: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};
const PLAN_STATUS_LABEL: Record<Subscription["status"], string> = {
  active: "Active", past_due: "Past due", cancelled: "Cancelled",
};

function YourPlanCard({
  subscription, hasPendingOffline, upgradeTarget, onChangePlan, onUpgrade,
}: {
  subscription: Subscription;
  hasPendingOffline: boolean;
  upgradeTarget: (typeof PLANS)[number] | null;
  onChangePlan: () => void;
  onUpgrade: () => void;
}) {
  const plan = PLANS.find((p) => p.id === subscription.planId);
  const isCancelled = subscription.status === "cancelled";
  const isFree = plan?.price === 0;
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!confirmingCancel) {
      setConfirmingCancel(true);
      return;
    }
    startTransition(async () => {
      await cancelSubscription();
      setConfirmingCancel(false);
      router.refresh();
    });
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Your plan</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Manage your plan.</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isCancelled ? (
            <FancyButton onClick={onChangePlan} disabled={hasPendingOffline} size="sm">Reactivate subscription</FancyButton>
          ) : (
            <>
              <button
                onClick={onChangePlan}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Change plan
              </button>
              {upgradeTarget && (
                <FancyButton onClick={onUpgrade} disabled={hasPendingOffline} size="sm">Upgrade</FancyButton>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2.5">
          <p className="text-2xl font-extrabold text-gray-900 dark:text-zinc-50">{subscription.planName}</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${PLAN_STATUS_CHIP[subscription.status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${PLAN_STATUS_DOT[subscription.status]}`} /> {PLAN_STATUS_LABEL[subscription.status]}
          </span>
        </div>
        {plan && plan.price !== null && (
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {plan.price === 0 ? "No payment required" : `${formatCurrency(plan.price)}/mo · billed monthly`}
          </p>
        )}
      </div>

      <div className="pt-4">
        <div className="mb-4 h-px bg-gray-100 dark:bg-zinc-800" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isCancelled ? (
            <span className="text-xs text-gray-400 dark:text-zinc-600">Your plan is cancelled — reactivate to resume billing.</span>
          ) : isFree ? (
            <span className="text-xs text-gray-400 dark:text-zinc-600">No billing cycle — upgrade anytime for more schools and students.</span>
          ) : subscription.renewsOn ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Renews on <span className="font-semibold text-gray-700 dark:text-zinc-300">{formatDate(subscription.renewsOn)}</span> — usage resets the same day.
            </p>
          ) : null}
          {!isCancelled && !isFree && (
            confirmingCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-zinc-600">You&rsquo;ll move to the Free plan immediately.</span>
                <button onClick={() => setConfirmingCancel(false)} className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:underline">Never mind</button>
                <button onClick={handleCancel} disabled={isPending} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50">
                  {isPending ? "Cancelling…" : "Confirm cancel"}
                </button>
              </div>
            ) : (
              <button onClick={handleCancel} className="text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Cancel plan
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payment method ────────────────────────────────────────────────────────────

export interface BillTo {
  orgName: string;
  location: string | null;
  email: string | null;
}

function PaymentMethodCard({ summary, razorpayMethod, razorpayMethodDetail, billTo, onUpdate }: {
  summary: string | null;
  razorpayMethod?: RazorpayMethod | null;
  razorpayMethodDetail?: string | null;
  billTo: BillTo | null;
  onUpdate: () => void;
}) {
  const isOffline = summary?.toLowerCase().includes("offline") ?? false;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Payment method</p>
      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
        {!summary
          ? "No payment method on file yet"
          : isOffline
          ? "Verified manually by our team each cycle"
          : "Charged automatically at the start of each cycle"}
      </p>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOffline ? "text-emerald-500 bg-emerald-500/10" : "text-indigo-500 bg-indigo-500/10"}`}>
          {isOffline ? (
            <Landmark className="h-4 w-4" />
          ) : (
            <PaymentMethodIcon
              razorpayMethod={razorpayMethod}
              razorpayMethodDetail={razorpayMethodDetail}
              summary={summary}
              className="h-4 w-4"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{summary ?? "No payment method yet"}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{summary ? "Used for your last payment" : "Pay once to set up billing"}</p>
        </div>
        <button
          onClick={onUpdate}
          className="shrink-0 h-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          {summary ? "Update" : "Add"}
        </button>
      </div>

      {billTo && (
        <>
          <div className="my-4 h-px bg-gray-100 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Billed to</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-1 truncate">{billTo.orgName}</p>
              {billTo.location && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{billTo.location}</p>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Billing email</p>
                <Link href="/dashboard/settings" className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Change</Link>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-1 truncate">{billTo.email ?? "—"}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Invoices and receipts are sent here</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Support & add-ons ─────────────────────────────────────────────────────────

function IncludedFeaturesCard({ planId, planName }: { planId: string; planName: string }) {
  const plan = PLANS.find((p) => p.id === planId);
  const features = plan?.features ?? [];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Included with {planName}</p>
      <div className="space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{f}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invoice table ─────────────────────────────────────────────────────────────

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Table
      header={
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Billing History</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">All past invoices and payments</p>
          </div>
        </div>
      }
    >
      <TableHead>
        <Th position="first">Invoice</Th>
        <Th>Period</Th>
        <Th>Plan</Th>
        <Th>Amount</Th>
        <Th>Method</Th>
        <Th>Status</Th>
        <Th position="last" align="right"></Th>
      </TableHead>
      <TableBody>
        {invoices.length === 0 ? (
          <TableEmptyRow colSpan={7} message="No invoices yet" />
        ) : invoices.map((inv) => {
          return (
            <Tr key={inv.id}>
              <Td position="first">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-mono text-xs text-gray-700 dark:text-zinc-300">{inv.invoiceNo}</span>
                </div>
              </Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{inv.period}</Td>
              <Td>
                <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">{inv.plan}</span>
              </Td>
              <Td className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(inv.amount)}</Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                {inv.paymentMethod ? (
                  <span className="flex items-center gap-1.5">
                    {inv.paymentMethod === "razorpay" ? (
                      <PaymentMethodIcon
                        razorpayMethod={inv.razorpayMethod}
                        razorpayMethodDetail={inv.razorpayMethodDetail}
                        summary={inv.paymentMethodSummary}
                        className="h-3.5 w-3.5 text-gray-400"
                      />
                    ) : (
                      <Landmark className="h-3.5 w-3.5 text-gray-400" />
                    )}{" "}
                    {inv.paymentMethodSummary ?? PAYMENT_METHOD_LABEL[inv.paymentMethod]}
                  </span>
                ) : "—"}
              </Td>
              <Td>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
              </Td>
              <Td position="last" align="right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6} className="w-44">
                    <DropdownMenuItem render={<Link href={`/dashboard/billing/${inv.id}`} />} className="cursor-pointer">
                      <Eye /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/dashboard/billing/${inv.id}?download=1`} />} className="cursor-pointer">
                      <Download /> Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Td>
            </Tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingClient({
  subscription, invoices, billTo,
}: {
  subscription: Subscription | null;
  invoices: Invoice[];
  billTo: BillTo | null;
}) {
  const [modal, setModal] = useState<{ open: boolean; initialStep: "select" | "pay"; initialPlanId?: PlanId }>({ open: false, initialStep: "select" });
  const router = useRouter();

  const pendingOfflineInvoice = useMemo(
    () => invoices.find((i) => i.status === "pending" && i.paymentMethod === "offline") ?? null,
    [invoices]
  );

  const upgradeTarget = useMemo(() => {
    if (!subscription) return null;
    const index = PLANS.findIndex((p) => p.id === subscription.planId);
    const next = index >= 0 ? PLANS[index + 1] : undefined;
    return next && next.price !== null ? next : null;
  }, [subscription]);

  function refresh() {
    router.refresh();
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
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Billing &amp; Subscription</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Manage your Shikshaloy plan, invoices, and payment method
        </p>
      </div>

      {pendingOfflineInvoice && <PendingOfflineBanner invoice={pendingOfflineInvoice} />}

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <YourPlanCard
            subscription={subscription}
            hasPendingOffline={Boolean(pendingOfflineInvoice)}
            upgradeTarget={upgradeTarget}
            onChangePlan={() => setModal({ open: true, initialStep: "select" })}
            onUpgrade={() => setModal({ open: true, initialStep: "pay", initialPlanId: upgradeTarget?.id })}
          />
        </div>
        <div className="lg:col-span-2">
          <PlanUsageCard
            subscription={subscription}
            upgradeTarget={upgradeTarget}
            onUpgrade={() => setModal({ open: true, initialStep: "pay", initialPlanId: upgradeTarget?.id })}
          />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <InvoiceTable invoices={invoices} />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <PaymentMethodCard
            summary={subscription.paymentMethodSummary}
            razorpayMethod={subscription.razorpayMethod}
            razorpayMethodDetail={subscription.razorpayMethodDetail}
            billTo={billTo}
            onUpdate={() => setModal({ open: true, initialStep: "pay", initialPlanId: subscription.planId as PlanId })}
          />
          <IncludedFeaturesCard planId={subscription.planId} planName={subscription.planName} />
        </div>
      </div>

      <ChangePlanModal
        open={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        currentPlanId={subscription.planId as PlanId}
        subscriptionStatus={subscription.status}
        initialStep={modal.initialStep}
        initialPlanId={modal.initialPlanId}
        onSuccess={refresh}
      />
    </div>
  );
}
