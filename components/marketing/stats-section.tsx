import { StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import { CountUp } from "@/components/ui/count-up";

const stats = [
  { value: "7", label: "Role-Based Dashboards" },
  { value: "40+", label: "Modules — Attendance to Payroll" },
  { value: "100%", label: "Data Scoped by School (RLS)" },
  { value: "24/7", label: "Live Product Demo Access" },
];

export function StatsSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "bg-white pt-4 pb-20 sm:pt-6 sm:pb-24" : "bg-white pt-16 pb-24 sm:pt-24 sm:pb-32"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <StaggerChildren className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className={`flex flex-col items-center gap-2 px-10 text-center ${compact ? "py-4 sm:py-2" : "py-8 sm:py-4"}`}>
                <p className={compact ? "text-3xl font-extrabold text-zinc-900 tracking-tight" : "text-5xl font-extrabold text-zinc-900 tracking-tight"}>
                  <CountUp value={s.value} />
                </p>
                <p className="text-sm text-zinc-500">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
