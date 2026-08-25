import { MessageSquare, FileSpreadsheet, BookOpen, PhoneCall, ArrowRight, ClipboardCheck, LayoutDashboard, BellRing } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const swaps = [
  {
    before: { icon: MessageSquare, label: "Scattered WhatsApp groups" },
    after: { icon: BellRing, label: "In-app announcements & messaging" },
  },
  {
    before: { icon: FileSpreadsheet, label: "Fee tracking in Excel" },
    after: { icon: LayoutDashboard, label: "Live fee dashboards & receipts" },
  },
  {
    before: { icon: BookOpen, label: "Paper attendance registers" },
    after: { icon: ClipboardCheck, label: "Digital attendance in seconds" },
  },
  {
    before: { icon: PhoneCall, label: "Phone calls for every update" },
    after: { icon: BellRing, label: "Automated parent alerts" },
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="relative bg-zinc-50/60 py-24 sm:py-32 border-y border-zinc-100 overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Why Schools Switch
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Replace the chaos with one system of record
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            Most schools run daily operations across five different tools that
            don&apos;t talk to each other. Shikshaloy replaces every one of them.
          </p>
        </FadeIn>

        <StaggerChildren className="space-y-3">
          {swaps.map((s) => (
            <StaggerItem key={s.before.label}>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white/60 px-6 py-4 opacity-70">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                    <s.before.icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-zinc-500 line-through decoration-zinc-300">
                    {s.before.label}
                  </p>
                </div>

                <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-primary-200 bg-white px-6 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white">
                    <s.after.icon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-zinc-900">{s.after.label}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
