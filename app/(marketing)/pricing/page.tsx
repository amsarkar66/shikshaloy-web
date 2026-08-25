import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { PLANS, formatCurrency, type PlanId } from "@/app/dashboard/billing/_data/billing";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

const title = "Pricing";
const description =
  "Simple, transparent pricing for schools of every size — from a free plan for a single school to custom Enterprise plans for school chains. No setup fees, no hidden costs.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing" },
  openGraph: { title, description, url: "/pricing", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
]);

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

// Hand-authored comparison matrix — separate from PLANS.features (those are
// curated marketing bullets per plan, not directly comparable row-by-row:
// e.g. "Basic fee management" vs "Full fee management" vs "Full fee &
// payroll" are three phrasings of one graduated capability, and quantities
// like "1 school" / "Up to 500 students" already have their own numeric rows
// below). Each row is either a plain boolean (✓/✗ across all plans) or a
// short per-plan label for graduated features.
type ComparisonValue = boolean | string;

interface ComparisonRow {
  label: string;
  values: Record<PlanId, ComparisonValue>;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Fee management",
    values: { free: "Basic", standard: "Full", premium: "Full + payroll", enterprise: "Full + payroll" },
  },
  {
    label: "Attendance tracking",
    values: { free: true, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Attendance device integration",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Homework & assignments",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Analytics & reports",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Transport & routes",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Library",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "ID cards & certificates",
    values: { free: true, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Gallery & events",
    values: { free: true, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Parent communication",
    values: { free: false, standard: true, premium: true, enterprise: true },
  },
  {
    label: "Multi-school management",
    values: { free: false, standard: false, premium: true, enterprise: true },
  },
  {
    label: "Hostel management",
    values: { free: false, standard: false, premium: true, enterprise: true },
  },
  {
    label: "Audit log",
    values: { free: false, standard: false, premium: true, enterprise: true },
  },
  {
    label: "Support",
    values: { free: "Email", standard: "Chat", premium: "Priority", enterprise: "Dedicated + SLA" },
  },
  {
    label: "Custom integrations",
    values: { free: false, standard: false, premium: false, enterprise: true },
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function PricingPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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

      <div className="-mt-8 scroll-mt-16">
        <PricingSection compareHref="#compare" />
      </div>

      {/* Full comparison table */}
      <section id="compare" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Full Comparison
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Compare every plan in detail
            </h2>
          </FadeIn>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60">
                  <th className="px-5 py-4 font-semibold text-zinc-500">Plan</th>
                  {PLANS.map((p) => (
                    <th
                      key={p.id}
                      className={`px-5 py-4 font-semibold text-zinc-900 ${p.id === "premium" ? "bg-primary-50/60" : ""}`}
                    >
                      {p.name}
                      {p.id === "premium" && (
                        <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                          Popular
                        </span>
                      )}
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
                    <td key={p.id} className={`px-5 py-3.5 text-zinc-900 ${p.id === "premium" ? "bg-primary-50/60" : ""}`}>
                      {p.schools ?? "Unlimited"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-5 py-3.5 text-zinc-500">Students</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className={`px-5 py-3.5 text-zinc-900 ${p.id === "premium" ? "bg-primary-50/60" : ""}`}>
                      {p.maxStudents ? p.maxStudents.toLocaleString("en-IN") : "Unlimited"}
                    </td>
                  ))}
                </tr>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="px-5 py-3.5 text-zinc-500">{row.label}</td>
                    {PLANS.map((p) => {
                      const value = row.values[p.id];
                      return (
                        <td key={p.id} className={`px-5 py-3.5 ${p.id === "premium" ? "bg-primary-50/60" : ""}`}>
                          {typeof value === "string" ? (
                            <span className="text-zinc-900">{value}</span>
                          ) : value ? (
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
      <section id="faq" className="scroll-mt-24 pb-24 sm:pb-32 border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32">
          <FaqAccordion
            badge="Need help?"
            heading="Frequently asked questions"
            subtext="Find quick answers about plans, limits, and how billing works."
            items={FAQ}
          />
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
