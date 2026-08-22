import Link from "next/link";
import { Check, X } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { PricingSection } from "@/components/marketing/pricing-section";
import { PLANS, formatCurrency } from "@/app/dashboard/billing/_data/billing";

const FAQ = [
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade any time from the Billing page in your dashboard — changes apply immediately and your next invoice is prorated.",
  },
  {
    q: "What happens if I exceed my student limit?",
    a: "We'll notify your admin before you hit the ceiling so you can upgrade. Existing student records are never locked or deleted.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. Every plan, including Free, is self-serve — sign up, onboard your school, and start adding students the same day.",
  },
  {
    q: "How does the Enterprise plan work?",
    a: "Enterprise is for large school chains and multi-branch institutions with custom needs — reach out and we'll scope pricing around your school count and integrations.",
  },
];

export default function PricingPage() {
  return (
    <main className="bg-white">
      <section className="pt-40 pb-16 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              One plan for every stage of your school
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              The exact same plans that power billing inside the Shikshaloy dashboard —
              no separate marketing pricing, no surprises.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="-mt-8">
        <PricingSection />
      </div>

      {/* Full comparison table */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Compare every plan in detail
            </h2>
          </FadeIn>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-5 py-4 font-semibold text-zinc-500">Plan</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-5 py-4 font-semibold text-zinc-900">
                      {p.name}
                      <div className="mt-1 font-normal text-zinc-500">
                        {p.price === null ? "Custom" : p.price === 0 ? "Free" : `${formatCurrency(p.price)}/mo`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-5 py-3.5 text-zinc-500">Schools</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 text-zinc-900">{p.schools ?? "Unlimited"}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-zinc-500">Students</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="px-5 py-3.5 text-zinc-900">
                      {p.maxStudents ? p.maxStudents.toLocaleString("en-IN") : "Unlimited"}
                    </td>
                  ))}
                </tr>
                {Array.from(new Set(PLANS.flatMap((p) => [...p.features, ...p.unavailable]))).map((feature) => (
                  <tr key={feature}>
                    <td className="px-5 py-3.5 text-zinc-500">{feature}</td>
                    {PLANS.map((p) => {
                      const included = (p.features as readonly string[]).includes(feature);
                      return (
                        <td key={p.id} className="px-5 py-3.5">
                          {included ? (
                            <Check className="h-4 w-4 text-primary-600" />
                          ) : (
                            <X className="h-4 w-4 text-zinc-300" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 sm:pb-32 border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="font-semibold text-zinc-900 mb-2">{item.q}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-zinc-500">
            Still have questions?{" "}
            <Link href="/contact" className="font-semibold text-primary-600 hover:text-primary-700">
              Talk to us
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
