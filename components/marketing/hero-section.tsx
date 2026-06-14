import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-indigo-950 overflow-hidden pt-16">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <FadeIn delay={0}>
          <Badge className="mb-6 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 px-4 py-1.5 text-sm">
            Modern School Management System
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight max-w-5xl mx-auto">
            The Complete Platform{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              for Modern Schools
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg sm:text-xl text-indigo-200/80 max-w-2xl mx-auto leading-relaxed">
            Shikshaloy unifies administration, teaching, parents, and students in
            one powerful platform — built for the way schools actually work.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-6 text-base font-semibold rounded-xl group"
              >
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="ghost"
              className="text-indigo-200 hover:text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl border border-white/10"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </div>
        </FadeIn>

        {/* Dashboard preview card */}
        <FadeIn delay={0.45} className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-950/50">
            <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="mx-auto text-xs text-indigo-400">
                shikshaloy.com/dashboard
              </div>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-indigo-900/50 to-violet-900/30 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-2xl">
                {["Students", "Teachers", "Classes", "Attendance", "Exams", "Revenue"].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/5 border border-white/10 p-4 text-center"
                  >
                    <div
                      className="h-6 rounded bg-indigo-500/30 mb-2 mx-auto"
                      style={{ width: `${50 + (i % 3) * 20}%` }}
                    />
                    <p className="text-xs text-indigo-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-indigo-600/20 blur-2xl rounded-full" />
        </FadeIn>
      </div>
    </section>
  );
}
