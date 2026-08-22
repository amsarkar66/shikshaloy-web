import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import { Target, Users, Layers, ShieldCheck } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Built around real school workflows",
    desc: "Every module — attendance, fees, exams, admissions — was designed by walking through how Indian schools actually run their day, not by copying a generic SaaS template.",
  },
  {
    icon: Users,
    title: "Seven roles, one source of truth",
    desc: "Super admins, admins, teachers, staff, students, parents, and drivers all work from the same live data — no more mismatched spreadsheets between the office and the classroom.",
  },
  {
    icon: Layers,
    title: "One platform, not a bundle of tools",
    desc: "Admissions, academics, attendance, fees, transport, and communication live in one system, so information entered once shows up everywhere it's needed.",
  },
  {
    icon: ShieldCheck,
    title: "Data stays where it belongs",
    desc: "Every school's records are isolated at the database level — school staff, students, and parents can only ever see their own institution's data.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="relative pt-40 pb-20 sm:pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              About Shikshaloy
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Modern software for the way schools actually run
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              Shikshaloy is a school management platform built to replace the
              spreadsheets, register books, and scattered WhatsApp groups most
              schools still run on — with one connected system every role can trust.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 sm:py-24 border-y border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Our mission
            </h2>
            <p className="mt-5 text-zinc-600 leading-relaxed text-balance">
              Administrative overhead shouldn&apos;t stand between teachers and
              teaching, or between parents and knowing how their child is
              doing today. We&apos;re building Shikshaloy so that every school —
              regardless of size or budget — can run attendance, academics,
              fees, and communication on infrastructure as solid as any large
              institution&apos;s, without needing an IT department to manage it.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              What we believe
            </h2>
          </FadeIn>
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-7 h-full shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-4">
                    <v.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{v.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      <section className="bg-primary-950 py-20 text-center">
        <FadeIn className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight text-balance">
            We&apos;re early, and building in the open
          </h2>
          <p className="mt-4 text-primary-200">
            The best way to know Shikshaloy is to explore it — try any of the
            seven role dashboards with real, populated data.
          </p>
          <div className="mt-8">
            <FancyButton href="/demo" size="lg">
              Try the Live Demo
              <ArrowUpRightIcon className="size-5" />
            </FancyButton>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
