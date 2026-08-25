import { BellRing, Calendar, Wallet, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { PlayStoreBadge } from "@/components/marketing/play-store-badge";

const highlights = [
  "Real-time attendance & fee alerts",
  "Homework, exams, and announcements on the go",
  "Same account, same data — web or app",
];

const chartBars = [38, 62, 45, 78, 54, 90, 66];

export function MobileAppSection() {
  return (
    <section className="bg-white py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 items-center gap-12 lg:gap-20">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Now on Android
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Shikshaloy in your pocket
            </h2>
            <p className="mt-4 text-lg text-zinc-500 max-w-md leading-relaxed text-balance">
              Download the free Shikshaloy app for teachers, parents, and
              students — stay connected to the school without opening a
              browser.
            </p>

            <ul className="mt-6 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-zinc-600">
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary-500 shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <PlayStoreBadge />
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="relative mx-auto w-56 sm:w-64">
            <div className="rounded-[2rem] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-300/50">
              <div className="rounded-[1.4rem] overflow-hidden bg-white">
                <div className="h-5 bg-zinc-900 flex items-center justify-center">
                  <div className="h-1 w-10 rounded-full bg-zinc-700" />
                </div>
                <div className="p-3 space-y-3 bg-gradient-to-br from-primary-50/50 to-white">
                  <div className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 p-2.5 shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-900">96.4%</p>
                      <p className="text-[8px] text-zinc-400">Attendance today</p>
                    </div>
                    <Calendar className="h-4 w-4 text-primary-500" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white border border-zinc-200 p-2.5 shadow-sm">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-900">₹8.2L</p>
                      <p className="text-[8px] text-zinc-400">Fees collected</p>
                    </div>
                    <Wallet className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="rounded-xl bg-white border border-zinc-200 p-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BellRing className="h-3.5 w-3.5 text-primary-500" />
                      <p className="text-[9px] font-semibold text-zinc-700">New announcement</p>
                    </div>
                    <div className="flex items-end gap-1 h-10 px-0.5">
                      {chartBars.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-primary-300"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-10 bg-primary-300/30 blur-2xl rounded-full -z-10" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
