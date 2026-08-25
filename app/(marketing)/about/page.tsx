import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { CtaSection } from "@/components/marketing/cta-section";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";
import { Lock } from "lucide-react";

const title = "About Us";
const description =
  "Shikshaloy replaces spreadsheets, register books, and scattered WhatsApp groups with one connected school management platform for admins, teachers, students, parents, staff, and drivers.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title, description, url: "/about", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);

const principles = [
  {
    n: "01",
    title: "Built around real school workflows",
    desc: "Every module — attendance, fees, exams, admissions — was designed by walking through how Indian schools actually run their day, not by copying a generic SaaS template.",
  },
  {
    n: "02",
    title: "Seven roles, one source of truth",
    desc: "Super admins, admins, teachers, staff, students, parents, and drivers all work from the same live data — no more mismatched spreadsheets between the office and the classroom.",
  },
  {
    n: "03",
    title: "One platform, not a bundle of tools",
    desc: "Admissions, academics, attendance, fees, transport, and communication live in one system, so information entered once shows up everywhere it's needed.",
  },
  {
    n: "04",
    title: "Data stays where it belongs",
    desc: "Every school's records are isolated at the database level — school staff, students, and parents can only ever see their own institution's data.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* Hero — asymmetric, left-aligned, headline + bleeding dashboard preview */}
      <section className="relative pt-40 pb-14 sm:pb-20 lg:min-h-[calc(260px+36.25vw)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[500px] bg-primary-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:pl-8">
          <div className="max-w-xl pt-20">
            <FadeIn>
              <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-4">
                About Shikshaloy
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-[5rem] font-extrabold text-zinc-900 tracking-tight leading-[0.98] text-balance">
                Software for the way schools{" "}
                <span className="text-primary-500">actually run</span>
              </h1>
              <p className="mt-6 text-lg text-zinc-500 max-w-xl leading-relaxed text-balance">
                Shikshaloy replaces the spreadsheets, register books, and
                scattered WhatsApp groups most schools still run on — with one
                connected system every role can trust.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <FancyButton href="/demo" size="lg">
                  Try the Live Demo
                  <ArrowUpRightIcon className="size-5" />
                </FancyButton>
                <FancyButton href="/pricing" variant="white" size="lg">
                  See Pricing
                </FancyButton>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Dashboard preview — bleeds past the true right edge of the viewport, cropped by the section */}
        <FadeIn
          delay={0.2}
          className="hidden lg:block absolute top-40 left-[54%] w-[58vw]"
        >
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xl shadow-zinc-300/40 [-webkit-mask-image:linear-gradient(to_bottom,#000_45%,transparent_82%)] [mask-image:linear-gradient(to_bottom,#000_45%,transparent_82%)]">
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 flex justify-center min-w-0">
                <div className="flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs text-zinc-400 max-w-[260px] w-full">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span className="truncate">shikshaloy.com/dashboard</span>
                </div>
              </div>
              <div className="w-[52px] shrink-0" aria-hidden />
            </div>

            <div className="relative aspect-[16/10] overflow-hidden bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about-dashboard-preview.png"
                alt="Shikshaloy dashboard overview"
                className="absolute top-0 left-0 h-auto max-w-none select-none pointer-events-none"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Manifesto — a single dramatic full-bleed statement instead of a small paragraph block */}
      <section className="relative -mt-16 bg-primary-950 pt-14 pb-24 sm:pt-16 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[420px] bg-primary-600/25 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <FadeIn className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-primary-300 font-semibold text-sm uppercase tracking-widest mb-6">
            Our mission
          </p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
            Administrative overhead shouldn&apos;t stand between teachers and
            teaching — or between parents and knowing how their child is
            doing today.
          </p>
          <p className="mt-8 text-primary-200 text-lg max-w-2xl mx-auto leading-relaxed text-balance">
            We&apos;re building Shikshaloy so every school — regardless of
            size or budget — can run attendance, academics, fees, and
            communication on infrastructure as solid as any large
            institution&apos;s, without needing an IT department to manage it.
          </p>

          {/* Signature sign-off */}
          <div className="mt-14 flex flex-col items-center gap-3">
            <svg width="130" height="60" viewBox="0 0 130 60" fill="none" className="text-primary-400/50">
              <path
                d="M14 40 C 18 18, 34 10, 40 22 C 45 32, 34 40, 28 34 C 21 27, 32 18, 46 22 C 58 25, 62 34, 72 32 C 82 30, 84 20, 92 24 C 98 27, 96 34, 104 32 C 112 30, 114 24, 118 22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2.5 3.5"
              />
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Team Shikshaloy</p>
              <p className="mt-0.5 font-mono text-xs text-primary-300">
                built for the way schools actually run
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Principles — an editorial numbered list, not another icon-card grid */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-16 max-w-xl">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              What we believe
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Four ideas everything else is built on
            </h2>
          </FadeIn>

          <div className="border-t border-zinc-200">
            {principles.map((p) => (
              <FadeIn key={p.n}>
                <div className="grid grid-cols-[auto_1fr] gap-6 sm:gap-10 py-10 sm:py-12 border-b border-zinc-200">
                  <span className="text-4xl sm:text-5xl font-extrabold text-zinc-200 tabular-nums leading-none">
                    {p.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">{p.title}</h3>
                    <p className="text-zinc-500 leading-relaxed max-w-xl">{p.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        heading="We're early, and building in the open"
        subtext="The best way to know Shikshaloy is to explore it — try any of the seven role dashboards with real, populated data."
        primaryLabel="Try the Live Demo"
        primaryHref="/demo"
        secondaryLabel="Get Started Free"
        secondaryHref="/signup"
      />
    </main>
  );
}
