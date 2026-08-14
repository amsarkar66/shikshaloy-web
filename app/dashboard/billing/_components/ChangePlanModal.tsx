"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X, CheckCircle2, ChevronRight, ChevronLeft, Star, Loader2,
  CreditCard, Landmark, Upload, AlertTriangle, PartyPopper, Clock,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { PLANS, formatCurrency, type PlanId, type SubscriptionStatus } from "../_data/billing";
import { createRazorpayOrder, verifyRazorpayPayment, submitOfflinePayment } from "../actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Step = "select" | "pay" | "success";
type PayMethod = "razorpay" | "offline";

function PlanPickCard({ plan, isCurrent, onSelect }: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const Icon = plan.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isCurrent}
      className={`relative rounded-2xl border bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-3 text-left transition-all ${
        isCurrent
          ? "border-gray-200 dark:border-zinc-800 opacity-60 cursor-default"
          : "border-gray-200 dark:border-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm"
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Star className="h-2.5 w-2.5" /> Current plan
        </span>
      )}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${plan.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{plan.name}</p>
        <p className="text-base font-extrabold text-gray-900 dark:text-zinc-50 leading-tight mt-0.5">
          {formatCurrency(plan.price ?? 0)}
          <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">/mo</span>
        </p>
      </div>
      <ul className="space-y-1">
        {plan.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-zinc-300">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" /> {f}
          </li>
        ))}
      </ul>
      <span className={`mt-auto flex items-center gap-1 text-xs font-semibold ${
        isCurrent ? "text-gray-400 dark:text-zinc-600" : "text-primary-600 dark:text-primary-400"
      }`}>
        {isCurrent ? "Currently active" : "Select this plan"}
        {!isCurrent && <ChevronRight className="h-3 w-3" />}
      </span>
    </button>
  );
}

function EnterprisePickCard({ plan, isCurrent, onSelect }: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const Icon = plan.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isCurrent}
      className={`w-full rounded-2xl border bg-gradient-to-r from-primary-50 to-white dark:from-primary-500/5 dark:to-transparent p-4 flex items-center gap-4 text-left transition-all ${
        isCurrent
          ? "border-gray-200 dark:border-zinc-800 opacity-60 cursor-default"
          : "border-gray-200 dark:border-zinc-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${plan.color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{plan.name}</p>
          {isCurrent && (
            <span className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">
              <Star className="h-2.5 w-2.5" /> Current plan
            </span>
          )}
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">Custom pricing</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{plan.features.slice(0, 3).join(" · ")}</p>
      </div>
      <span className={`shrink-0 flex items-center gap-1 text-xs font-semibold ${isCurrent ? "text-gray-400 dark:text-zinc-600" : "text-indigo-600 dark:text-indigo-400"}`}>
        {isCurrent ? "Currently active" : "Contact sales"}
        {!isCurrent && <ChevronRight className="h-3 w-3" />}
      </span>
    </button>
  );
}

export default function ChangePlanModal({
  open, onClose, currentPlanId, subscriptionStatus, initialStep = "select", initialPlanId, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  initialStep?: Step;
  initialPlanId?: PlanId;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId ?? currentPlanId);
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setSelectedPlanId(initialPlanId ?? currentPlanId);
      setPayMethod(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId)!;
  const isReactivating = subscriptionStatus === "cancelled";
  const paidPlans = PLANS.filter((p) => p.id !== "enterprise");
  const enterprisePlan = PLANS.find((p) => p.id === "enterprise")!;

  function handleClose() {
    onClose();
    setTimeout(() => {
      setStep(initialStep);
      setPayMethod(null);
      setReference("");
      setNote("");
      setReceipt(null);
      setError(null);
    }, 200);
  }

  function handlePickPlan(id: PlanId) {
    const plan = PLANS.find((p) => p.id === id);
    if (!plan || plan.id === currentPlanId) return;
    if (plan.price === null) {
      window.location.href = "/dashboard/help";
      return;
    }
    setSelectedPlanId(id);
    setPayMethod(null);
    setError(null);
    setStep("pay");
  }

  async function handleRazorpayPay() {
    setError(null);
    setPaying(true);
    try {
      const order = await createRazorpayOrder(selectedPlanId);
      if (!order.keyId) {
        setError("Payment gateway is not configured yet. Please contact support or pay offline.");
        setPaying(false);
        return;
      }
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError("Couldn't load the payment widget. Check your connection and try again.");
        setPaying(false);
        return;
      }
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shikshaloy",
        description: `${selectedPlan.name} plan subscription`,
        theme: { color: "#6366f1" },
        handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          startTransition(async () => {
            try {
              await verifyRazorpayPayment({
                planId: selectedPlanId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              setStep("success");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Payment verification failed");
            } finally {
              setPaying(false);
            }
          });
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start payment");
      setPaying(false);
    }
  }

  function handleOfflineSubmit() {
    setError(null);
    if (!reference.trim()) return setError("Enter a payment reference / UTR number.");
    if (!receipt) return setError("Upload a receipt or payment screenshot.");
    const formData = new FormData();
    formData.append("planId", selectedPlanId);
    formData.append("reference", reference.trim());
    formData.append("note", note.trim());
    formData.append("receipt", receipt);
    startTransition(async () => {
      try {
        await submitOfflinePayment(formData);
        setStep("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't submit payment");
      }
    });
  }

  function handleDone() {
    handleClose();
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {step === "pay" && (
              <button
                onClick={() => setStep("select")}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">
              {step === "select" ? (isReactivating ? "Reactivate subscription" : "Change plan")
                : step === "pay" ? `Pay for ${selectedPlan.name}`
                : "All set"}
            </h2>
          </div>
          <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "select" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paidPlans.map((plan) => (
                  <PlanPickCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={plan.id === currentPlanId && !isReactivating}
                    onSelect={() => handlePickPlan(plan.id)}
                  />
                ))}
              </div>
              <EnterprisePickCard
                plan={enterprisePlan}
                isCurrent={enterprisePlan.id === currentPlanId && !isReactivating}
                onSelect={() => handlePickPlan(enterprisePlan.id)}
              />
            </div>
          )}

          {step === "pay" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{selectedPlan.name} plan</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Billed monthly</p>
                </div>
                <p className="text-lg font-extrabold text-gray-900 dark:text-zinc-50">{formatCurrency(selectedPlan.price ?? 0)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPayMethod("razorpay"); setError(null); }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    payMethod === "razorpay" ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5" : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-indigo-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Pay with Razorpay</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Card, UPI or netbanking — activates instantly</p>
                </button>
                <button
                  onClick={() => { setPayMethod("offline"); setError(null); }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    payMethod === "offline" ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5" : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <Landmark className="h-5 w-5 text-indigo-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Pay offline</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Bank transfer — verified by our team within 1 business day</p>
                </button>
              </div>

              {payMethod === "offline" && (
                <div className="space-y-3 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Payment reference / UTR number</label>
                    <input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. UTR1234567890"
                      className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Note (optional)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Any extra detail for our team"
                      className="w-full resize-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-zinc-400">Receipt / screenshot</label>
                    <label className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-center hover:border-primary-400 transition-colors">
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{receipt ? receipt.name : "JPG, PNG or PDF (max. 5MB)"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              {payMethod === "razorpay" ? (
                <>
                  <PartyPopper className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Plan updated!</p>
                  <p className="max-w-sm text-xs text-gray-500 dark:text-zinc-400">
                    You&rsquo;re now on the {selectedPlan.name} plan. It&rsquo;s active right away.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="h-10 w-10 text-amber-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Submitted for verification</p>
                  <p className="max-w-sm text-xs text-gray-500 dark:text-zinc-400">
                    We&rsquo;ve received your payment details for the {selectedPlan.name} plan. Our team usually verifies offline payments within 1 business day — you&rsquo;ll get an email once it&rsquo;s active.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 px-5 py-4 shrink-0">
          {step === "pay" && (
            <>
              <button onClick={handleClose} className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:underline">Cancel</button>
              {payMethod === "razorpay" && (
                <FancyButton onClick={handleRazorpayPay} disabled={paying || isPending} size="sm">
                  {paying || isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                  {paying || isPending ? "Processing…" : `Pay ${formatCurrency(selectedPlan.price ?? 0)}`}
                </FancyButton>
              )}
              {payMethod === "offline" && (
                <FancyButton onClick={handleOfflineSubmit} disabled={isPending} size="sm">
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {isPending ? "Submitting…" : "Submit for verification"}
                </FancyButton>
              )}
            </>
          )}
          {step === "success" && (
            <FancyButton onClick={handleDone} size="sm">Done</FancyButton>
          )}
        </div>
      </div>
    </div>
  );
}
