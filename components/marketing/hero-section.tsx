import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

export function HeroSection() {
  return (
    <section className="relative flex items-center bg-white overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Soft gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-primary-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[8%] w-[420px] h-[420px] bg-primary-300/30 rounded-full blur-3xl" />
        <div className="absolute top-[10%] right-[5%] w-[380px] h-[380px] bg-amber-200/30 rounded-full blur-3xl" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle,#d4d4d8 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0}>
          <Badge className="mb-6 h-auto bg-white text-primary-700 border border-zinc-200 shadow-sm px-4 py-1.5 text-sm gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Modern School Management System
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-zinc-900 leading-[1.05] tracking-tight max-w-5xl mx-auto text-balance">
            The complete platform{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">
              for modern schools
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed text-balance">
            Shikshaloy unifies administration, teaching, parents, and students in
            one powerful platform — built for the way schools actually work.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <FancyButton href="/login" size="lg">
              Start your free trial
              <ArrowUpRightIcon className="size-5" />
            </FancyButton>
            <FancyButton variant="white" size="lg" className="group">
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </FancyButton>
          </div>
        </FadeIn>

        {/* Dashboard preview card */}
        <FadeIn delay={0.45} className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-2xl shadow-zinc-300/40">
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="mx-auto text-xs text-zinc-400">
                shikshaloy.com/dashboard
              </div>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-2xl">
                {["Students", "Teachers", "Classes", "Attendance", "Exams", "Revenue"].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white border border-zinc-200 p-4 text-center shadow-sm"
                  >
                    <div
                      className="h-6 rounded-md bg-primary-200 mb-2 mx-auto"
                      style={{ width: `${50 + (i % 3) * 20}%` }}
                    />
                    <p className="text-xs text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-primary-300/30 blur-2xl rounded-full" />
        </FadeIn>
      </div>
    </section>
  );
}
