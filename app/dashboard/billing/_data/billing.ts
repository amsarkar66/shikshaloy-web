import { Zap, BarChart3, Building2, Landmark } from "lucide-react";

export const PLANS = [
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

export type PlanId = (typeof PLANS)[number]["id"];

export type InvoiceStatus = "paid" | "pending" | "failed";
export type SubscriptionStatus = "active" | "past_due" | "cancelled";

export interface Invoice {
  id: string;
  invoiceNo: string;
  period: string;
  plan: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
}

export interface Subscription {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  schoolsUsed: number;
  maxSchools: number;
  monthlyFee: number;
  renewsOn: string;
  paymentMethodSummary: string | null;
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
