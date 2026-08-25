import { MousePointerClick, UserPlus, Rocket, ArrowRight } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const steps = [
  {
    icon: MousePointerClick,
    step: "01",
    meta: "0 signups needed",
    title: "Explore instantly",
    text: "No signup, no forms — pick any of 7 roles in the live demo and see the real dashboard right now.",
  },
  {
    icon: UserPlus,
    step: "02",
    meta: "~15 minutes",
    title: "Set up your school",
    text: "Add classes and sections, import students and staff, and invite your team — done in minutes, not weeks.",
  },
  {
    icon: Rocket,
    step: "03",
    meta: "Same day, live",
    title: "Go live, school-wide",
    text: "Attendance, fees, exams, and communication — synced in real time, on any device, from day one.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-12 lg:gap-20">
          {/* Left — sticky-feeling header, editorial style */}
          <FadeIn className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
              From first click to fully live
            </h2>
            <p className="mt-4 text-zinc-500 leading-relaxed text-balance">
              We&apos;re early — so instead of borrowed quotes, here&apos;s exactly what
              happens when a school picks up Shikshaloy.
            </p>
            <a
              href="/demo"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              See it yourself in the live demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </FadeIn>

          {/* Right — vertical timeline */}
          <div>
            <StaggerChildren className="relative">
              <div className="absolute left-7 top-3 bottom-3 w-px bg-gradient-to-b from-primary-200 via-primary-200 to-transparent" />
              <div className="space-y-12">
                {steps.map((s) => (
                  <StaggerItem key={s.step}>
                    <div className="relative flex gap-6">
                      <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-primary-100 bg-white shadow-sm">
                        <s.icon className="h-6 w-6 text-primary-600" />
                      </span>
                      <div className="min-w-0 pt-1.5">
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-xs font-bold tracking-widest text-primary-400">
                            STEP {s.step}
                          </span>
                          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:inline-block" />
                          <span className="text-xs font-medium text-zinc-400">{s.meta}</span>
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">{s.title}</h3>
                        <p className="max-w-xl text-zinc-500 leading-relaxed">{s.text}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerChildren>
          </div>
        </div>
      </div>
    </section>
  );
}
