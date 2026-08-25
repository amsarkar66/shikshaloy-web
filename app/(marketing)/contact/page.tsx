import type { Metadata } from "next";
import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { FadeIn } from "@/components/ui/fade-in";
import { Mail, Phone } from "lucide-react";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";
import { worldMapSvg } from "@/lib/marketing/dotted-world-map";
import { ContactForm } from "./_components/contact-form";

const title = "Contact Us";
const description =
  "Get in touch with Shikshaloy for sales questions, support, or a walkthrough of the platform — by email, phone, or the live demo. We read every message.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title, description, url: "/contact", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);

const channels = [
  { icon: Mail, label: "support@shikshaloy.com", href: "mailto:support@shikshaloy.com" },
  { icon: Phone, label: "+91 99327 97131", href: "tel:+919932797131" },
];

export default function ContactPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="relative pt-40 pb-24 sm:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none [mask-image:linear-gradient(to_bottom,#000_0%,#000_45%,transparent_90%)]">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Contact Us
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Talk to us about your school
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              Whether you&apos;re evaluating Shikshaloy for your school or already
              onboard, we&apos;re a message away.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="relative overflow-hidden pb-24 sm:pb-32">
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none [mask-image:radial-gradient(ellipse_55%_65%_at_center,#000_25%,transparent_75%)] [-webkit-mask-image:radial-gradient(ellipse_55%_65%_at_center,#000_25%,transparent_75%)]"
          aria-hidden="true"
        >
          <div
            className="w-[1600px] max-w-none shrink-0 [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: worldMapSvg }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <FadeIn>
              <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60">
                <ContactForm />
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {channels.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-primary-600 transition-colors"
                  >
                    <c.icon className="h-4 w-4 text-primary-500" />
                    {c.label}
                  </a>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn className="mt-16 rounded-2xl bg-primary-950 p-10 text-center">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Prefer to just look around first?
            </h2>
            <p className="mt-3 text-primary-200 max-w-xl mx-auto">
              Sign into any of the 7 role dashboards with live, realistic data —
              no forms, no waiting on a reply.
            </p>
            <div className="mt-7 flex justify-center">
              <FancyButton href="/demo" size="lg">
                Try the Live Demo
                <ArrowUpRightIcon className="size-5" />
              </FancyButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
