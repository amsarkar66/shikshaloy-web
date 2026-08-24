import type { Metadata } from "next";
import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { FadeIn } from "@/components/ui/fade-in";
import { Mail, Phone, PlayCircle } from "lucide-react";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

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
  {
    icon: Mail,
    title: "Email",
    detail: "support@shikshaloy.com",
    href: "mailto:support@shikshaloy.com",
    desc: "For sales questions, support, or anything else — we read every email.",
  },
  {
    icon: Phone,
    title: "Phone",
    detail: "+91 99327 97131",
    href: "tel:+919932797131",
    desc: "Available for schools evaluating Shikshaloy or existing customers.",
  },
  {
    icon: PlayCircle,
    title: "Live Demo",
    detail: "No signup required",
    href: "/demo",
    desc: "The fastest way to get answers — explore a fully populated dashboard yourself.",
  },
];

export default function ContactPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="relative pt-40 pb-24 sm:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
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

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {channels.map((c) => (
              <FadeIn key={c.title}>
                <a
                  href={c.href}
                  className="group flex flex-col h-full rounded-2xl border border-zinc-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
                    <c.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{c.title}</h3>
                  <p className="text-sm font-medium text-primary-600 mb-2">{c.detail}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed flex-1">{c.desc}</p>
                </a>
              </FadeIn>
            ))}
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
