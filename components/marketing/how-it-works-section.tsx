import { MousePointerClick, UserPlus, Rocket, Clock, ShieldCheck, Smartphone } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const steps = [
  {
    icon: MousePointerClick,
    step: "01",
    title: "Explore instantly",
    text: "No signup, no forms — pick any of 7 roles in the live demo and see the real dashboard right now.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Set up your school",
    text: "Add classes and sections, import students and staff, and invite your team — done in minutes, not weeks.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Go live, school-wide",
    text: "Attendance, fees, exams, and communication — synced in real time, on any device, from day one.",
  },
];

const reasons = [
  {
    icon: Clock,
    title: "Built for daily use",
    text: "Attendance and fee reminders take seconds — staff keep using it after week one.",
  },
  {
    icon: ShieldCheck,
    title: "Every school's data stays its own",
    text: "Row-level security scopes every record to its school from the database up.",
  },
  {
    icon: Smartphone,
    title: "One app, every device",
    text: "The exact same dashboard, responsive on desktop, tablet, and phone.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            From first click to fully live
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            We&apos;re early — so instead of borrowed quotes, here&apos;s exactly what
            happens when a school picks up Shikshaloy.
          </p>
        </FadeIn>

        <StaggerChildren className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          <div className="hidden md:block absolute top-9 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white border-2 border-primary-100 shadow-sm mb-5">
                  <s.icon className="h-7 w-7 text-primary-600" />
                  <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary-950 text-[10px] font-bold text-white">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{s.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <FadeIn delay={0.1} className="mt-20 pt-10 border-t border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <r.icon className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn className="mt-10 text-center text-sm text-zinc-400">
          See it yourself in the{" "}
          <a href="/demo" className="font-semibold text-primary-600 hover:text-primary-700">
            live demo
          </a>
          .
        </FadeIn>
      </div>
    </section>
  );
}
