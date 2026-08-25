import { FancyButton } from "@/components/ui/fancy-button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import { PLANS, formatCurrency } from "@/app/dashboard/billing/_data/billing";

export function PricingSection() {
  return (
    <section id="pricing" className="relative bg-zinc-50/60 py-24 sm:py-32 border-y border-zinc-100 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => {
            const highlight = plan.id === "premium";
            return (
              <StaggerItem key={plan.id}>
                <div
                  className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                    highlight
                      ? "bg-primary-950 text-white shadow-2xl shadow-primary-900/20 ring-1 ring-primary-800"
                      : "bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  {highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 h-auto bg-primary-500 text-white border-none px-4 py-1 shadow-md">
                      Most Popular
                    </Badge>
                  )}

                  <div>
                    <p className={`font-semibold text-sm ${highlight ? "text-primary-300" : "text-primary-600"}`}>
                      {plan.name}
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className={`text-4xl font-extrabold tracking-tight ${highlight ? "text-white" : "text-zinc-900"}`}>
                        {plan.price === null ? "Custom" : plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                      </span>
                      {plan.price !== null && plan.price > 0 && (
                        <span className={`mb-1 text-sm ${highlight ? "text-primary-300" : "text-zinc-500"}`}>
                          /month
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 text-sm ${highlight ? "text-primary-200" : "text-zinc-500"}`}>
                      Up to {plan.schools ?? "unlimited"} school{plan.schools === 1 ? "" : "s"} ·{" "}
                      {plan.maxStudents ? `${plan.maxStudents.toLocaleString("en-IN")} students` : "unlimited students"}
                    </p>
                  </div>

                  <ul className="mt-8 space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check
                          className={`h-4 w-4 flex-shrink-0 ${
                            highlight ? "text-primary-400" : "text-primary-600"
                          }`}
                        />
                        <span className={highlight ? "text-primary-100" : "text-zinc-600"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <FancyButton
                      href={plan.id === "enterprise" ? "/contact" : "/signup"}
                      variant={highlight ? "primary" : "dark"}
                      className="w-full"
                    >
                      {plan.id === "enterprise" ? "Contact Sales" : plan.id === "free" ? "Get Started Free" : "Start Free Trial"}
                    </FancyButton>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>

        <FadeIn className="mt-8 text-center">
          <a href="/pricing" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Compare all plan details →
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
