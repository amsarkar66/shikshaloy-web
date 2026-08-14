import { FancyButton } from "@/components/ui/fancy-button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
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
    <section id="pricing" className="bg-zinc-50/60 py-24 sm:py-32 border-y border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Simple Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Plans that grow with your school
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            No hidden fees. No long-term lock-in. Start free and upgrade when you&apos;re ready.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                  plan.highlight
                    ? "bg-primary-950 text-white shadow-2xl shadow-primary-900/20 ring-1 ring-primary-800"
                    : "bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 h-auto bg-primary-500 text-white border-none px-4 py-1 shadow-md">
                    {plan.badge}
                  </Badge>
                )}

                <div>
                  <p className={`font-semibold text-sm ${plan.highlight ? "text-primary-300" : "text-primary-600"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? "text-white" : "text-zinc-900"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`mb-1 text-sm ${plan.highlight ? "text-primary-300" : "text-zinc-500"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-primary-200" : "text-zinc-500"}`}>
                    {plan.desc}
                  </p>
                </div>

                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlight ? "text-primary-400" : "text-primary-600"
                        }`}
                      />
                      <span className={plan.highlight ? "text-primary-100" : "text-zinc-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <FancyButton
                    href={plan.href}
                    variant={plan.highlight ? "primary" : "dark"}
                    className="w-full"
                  >
                    {plan.cta}
                  </FancyButton>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
