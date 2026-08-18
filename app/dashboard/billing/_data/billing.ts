import { Gift, BarChart3, Building2, Landmark, CreditCard, Smartphone, Wallet, Banknote, type LucideIcon } from "lucide-react";

export const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Gift,
    price: 0,
    schools: 1,
    maxStudents: 50,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    activeColor: "border-sky-500 ring-2 ring-sky-500/20",
    features: ["1 school", "Up to 50 students", "Basic fee management", "Attendance tracking", "Email support"],
    unavailable: ["Homework & assignments", "Analytics & reports", "Multi-school management", "Priority support", "Custom integrations"],
  },
  {
    id: "standard",
    name: "Standard",
    icon: BarChart3,
    price: 999,
    schools: 2,
    maxStudents: 500,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    activeColor: "border-blue-500 ring-2 ring-blue-500/20",
    features: ["Up to 2 schools", "Up to 500 students", "Full fee management", "Homework & assignments", "Analytics & reports", "Chat support"],
    unavailable: ["Multi-school management", "Priority support", "Custom integrations"],
  },
  {
    id: "premium",
    name: "Premium",
    icon: Building2,
    price: 1999,
    schools: 5,
    maxStudents: 2000,
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    activeColor: "border-violet-500 ring-2 ring-violet-500/20",
    features: [
      "Up to 5 schools",
      "Up to 2,000 students",
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
    maxStudents: null,
    color: "text-primary-500 bg-primary-500/10 border-primary-500/20",
    activeColor: "border-primary-500 ring-2 ring-primary-500/20",
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

export type PlanId = (typeof PLANS)[number]["id"];

export type InvoiceStatus = "paid" | "pending" | "failed";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";
export type PaymentMethod = "razorpay" | "offline";
export type RazorpayMethod = "card" | "netbanking" | "wallet" | "upi" | "emi" | "cardless_emi" | "paylater";

export interface Invoice {
  id: string;
  invoiceNo: string;
  period: string;
  plan: string;
  planId?: string | null;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  paymentMethod?: PaymentMethod | null;
  paymentMethodSummary?: string | null;
  razorpayMethod?: RazorpayMethod | null;
  razorpayMethodDetail?: string | null;
  offlineReference?: string | null;
  offlineNote?: string | null;
  offlineReceiptUrl?: string | null;
  verifiedAt?: string | null;
}

export interface Subscription {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  schoolsUsed: number;
  maxSchools: number;
  studentsUsed: number;
  monthlyFee: number;
  renewsOn: string;
  paymentMethodSummary: string | null;
  razorpayMethod?: RazorpayMethod | null;
  razorpayMethodDetail?: string | null;
}

export function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export const STATUS_BADGE: Record<InvoiceStatus, string> = {
  paid:    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/20   bg-amber-500/10   text-amber-600   dark:text-amber-400",
  failed:  "border-red-500/20     bg-red-500/10     text-red-600     dark:text-red-400",
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid", pending: "Pending", failed: "Failed",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  razorpay: "Razorpay",
  offline: "Bank transfer",
};

export const RAZORPAY_METHOD_ICON: Record<RazorpayMethod, LucideIcon> = {
  card: CreditCard,
  upi: Smartphone,
  netbanking: Landmark,
  wallet: Wallet,
  emi: CreditCard,
  cardless_emi: Banknote,
  paylater: Banknote,
};

// Older invoices were written before `razorpay_method` existed, so fall back to
// pattern-matching the human summary text ("Wallet (...)", "UPI (...)", etc).
export function resolveMethodIcon(
  razorpayMethod: RazorpayMethod | null | undefined,
  summary: string | null | undefined
): LucideIcon {
  if (razorpayMethod) return RAZORPAY_METHOD_ICON[razorpayMethod];
  if (summary) {
    if (/^wallet/i.test(summary)) return Wallet;
    if (/^upi/i.test(summary)) return Smartphone;
    if (/^netbanking/i.test(summary)) return Landmark;
    if (/pay later|cardless emi/i.test(summary)) return Banknote;
  }
  return CreditCard;
}

// Key for a self-hosted logo asset at /payment-icons/{key}.svg — e.g. "card-visa",
// "wallet-airtelmoney", "netbanking-hdfc", "upi". Returns null when there's no
// brand-specific detail (nothing to look up), so callers fall back to a generic icon.
export function resolveMethodLogoKey(
  razorpayMethod: RazorpayMethod | null | undefined,
  razorpayMethodDetail: string | null | undefined
): string | null {
  if (!razorpayMethod) return null;
  if (razorpayMethod === "upi") return "upi";
  if (razorpayMethodDetail) return `${razorpayMethod}-${razorpayMethodDetail}`;
  return null;
}

export function generateInvoiceNo(): string {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `INV-${yyyymm}-${suffix}`;
}

export function renewsOnFromToday(): { issuedIso: string; renewsIso: string } {
  const today = new Date();
  const renews = new Date(today);
  renews.setMonth(renews.getMonth() + 1);
  return {
    issuedIso: today.toISOString().slice(0, 10),
    renewsIso: renews.toISOString().slice(0, 10),
  };
}
