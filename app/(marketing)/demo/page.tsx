import type { Metadata } from "next";
import { Smartphone, Phone, Mail } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { DemoRoleExplorer } from "@/components/marketing/demo-role-explorer";
import { PlayStoreBadge } from "@/components/marketing/play-store-badge";
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

export default function DemoPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
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

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <DemoRoleExplorer />

          <FadeIn className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-zinc-200 bg-gradient-to-br from-primary-50/60 to-white p-7">
            <div className="flex items-start gap-3 text-left">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 shrink-0">
                <Smartphone className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Prefer trying it on your phone?</h3>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                  The Shikshaloy Android app uses the same dashboard and data — download it and sign in with any demo account above.
                </p>
              </div>
            </div>
            <PlayStoreBadge className="shrink-0" />
          </FadeIn>

          <FadeIn className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-7">
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
    </main>
  );
}
