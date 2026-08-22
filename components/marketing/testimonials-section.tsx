import { Clock, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const reasons = [
  {
    icon: Clock,
    title: "Built for daily use, not just onboarding",
    text: "Attendance, homework, and fee reminders take seconds, not spreadsheets — so staff actually keep using it after week one.",
  },
  {
    icon: ShieldCheck,
    title: "Every school's data stays its own",
    text: "Row-level security scopes every record to its school and role from the database up — nothing is ever visible across institutions.",
  },
  {
    icon: Smartphone,
    title: "One app, seven purpose-built experiences",
    text: "Super admins, admins, teachers, staff, students, parents, and drivers each get exactly the tools their role needs — no clutter.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Why Shikshaloy
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Why schools choose Shikshaloy
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            We&apos;re early — so instead of borrowed quotes, here&apos;s what the
            platform actually does. See it yourself in the{" "}
            <a href="/demo" className="font-semibold text-primary-600 hover:text-primary-700">
              live demo
            </a>
            .
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <StaggerItem key={r.title}>
              <div className="rounded-2xl bg-white border border-zinc-200 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-4">
                  <r.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{r.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed flex-1">{r.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <FadeIn className="mt-10 flex items-center justify-center gap-2 text-sm text-zinc-400">
          <Sparkles className="h-4 w-4" />
          Shikshaloy is in active development — real school stories will land here soon.
        </FadeIn>
      </div>
    </section>
  );
}
