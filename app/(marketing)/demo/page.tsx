import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { DemoRoleExplorer } from "@/components/marketing/demo-role-explorer";
import { DemoLivePreview } from "@/components/marketing/demo-live-preview";
import { DemoTestimonials } from "@/components/marketing/demo-testimonials";
import { StatsSection } from "@/components/marketing/stats-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FancyButton } from "@/components/ui/fancy-button";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

const title = "Live Demo";
const description =
  "Try Shikshaloy free, no signup required. Sign into a fully populated demo school as a super admin, admin, teacher, staff, student, parent, or driver and explore the real dashboard.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/demo" },
  openGraph: { title, description, url: "/demo", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Live Demo", path: "/demo" },
]);

const FAQ = [
  {
    q: "Is this a real Shikshaloy account, or a mockup?",
    a: "It's the exact same dashboard every paying customer uses, signed into a real (dedicated) demo school with realistic data — not screenshots or a scripted walkthrough.",
  },
  {
    q: "Is my data safe if I click around?",
    a: "Yes. These are shared demo accounts meant for evaluation — feel free to add, edit, or delete anything. The demo school resets to a clean baseline automatically every night, so nothing you do sticks around or affects other visitors.",
  },
  {
    q: "Do I need to sign up or enter payment details?",
    a: "No. Every role signs in with one click — no forms, no credit card, no email required.",
  },
  {
    q: "What's different between the demo and my own school's account?",
    a: "Nothing functionally — same dashboard, same modules, same permissions per role. The only difference is your own account has your school's real data, and it doesn't reset every night.",
  },
  {
    q: "How long can I use the demo for?",
    a: "As long as you like, in a single session — just remember any changes reset at midnight IST. If you want data that persists, start a free account instead.",
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

export default function DemoPage() {
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
      <section className="relative pt-40 pb-16 sm:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,#000_50%,transparent_100%)]">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Live Demo
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Pick a role. See the real dashboard.
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              No signup, no forms — one click signs you into a fully populated
              demo school as that role, using the exact same dashboard every
              Shikshaloy customer uses.
            </p>
          </FadeIn>
        </div>
      </section>

      <StatsSection compact />

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <DemoRoleExplorer />
        </div>
      </section>

      <DemoLivePreview />

      <DemoTestimonials />

      {/* FAQ */}
      <section className="pb-24 sm:pb-32 bg-zinc-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
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

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-7">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-zinc-900">Want assistance exploring the demo?</h3>
              <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                Talk to our team — we&apos;ll walk you through the dashboard live.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <FancyButton href="tel:+919932797131" variant="white" size="sm">
                <Phone className="h-4 w-4" />
                Call Us
              </FancyButton>
              <FancyButton href="mailto:support@shikshaloy.com" variant="primary" size="sm">
                <Mail className="h-4 w-4" />
                Email Us
              </FancyButton>
            </div>
          </FadeIn>
        </div>
      </section>

      <CtaSection
        heading="Ready to bring this to your school?"
        subtext="You've seen the dashboard — now set up your own school in minutes, free for up to 50 students."
        primaryLabel="Get Started Free"
        primaryHref="/signup"
        secondaryLabel="See Pricing"
        secondaryHref="/pricing"
      />
    </main>
  );
}
