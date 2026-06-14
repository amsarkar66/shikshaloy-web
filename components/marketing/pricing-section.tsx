import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for small schools getting started.",
    badge: null,
    cta: "Get Started Free",
    href: "/login",
    features: [
      "Up to 100 students",
      "Admin + Teacher portals",
      "Attendance tracking",
      "Basic reports",
      "Email support",
    ],
    highlight: false,
  },
  {
    name: "School",
    price: "₹2,999",
    period: "/month",
    desc: "For growing schools that need the full suite.",
    badge: "Most Popular",
    cta: "Start Free Trial",
    href: "/login",
    features: [
      "Up to 1,000 students",
      "All 5 role portals",
      "Fee management",
      "Exam & report cards",
      "SMS + push notifications",
      "Analytics dashboard",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large institutions and school chains.",
    badge: null,
    cta: "Contact Sales",
    href: "#contact",
    features: [
      "Unlimited students",
      "Multi-branch support",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
    ],
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Simple Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Plans That Grow With Your School
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            No hidden fees. No long-term lock-in. Start free and upgrade when you&apos;re ready.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={`relative rounded-2xl p-8 flex flex-col h-full ${
                  plan.highlight
                    ? "bg-indigo-950 text-white shadow-2xl shadow-indigo-900/30 ring-2 ring-indigo-500"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white border-none px-4 py-1">
                    {plan.badge}
                  </Badge>
                )}

                <div>
                  <p className={`font-semibold text-sm ${plan.highlight ? "text-indigo-300" : "text-indigo-600"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`mb-1 text-sm ${plan.highlight ? "text-indigo-300" : "text-slate-500"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                    {plan.desc}
                  </p>
                </div>

                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlight ? "text-indigo-400" : "text-indigo-600"
                        }`}
                      />
                      <span className={plan.highlight ? "text-indigo-100" : "text-slate-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href={plan.href}>
                    <Button
                      className={`w-full py-5 font-semibold rounded-xl transition-all duration-200 ${
                        plan.highlight
                          ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                          : "bg-indigo-950 hover:bg-indigo-900 text-white"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
