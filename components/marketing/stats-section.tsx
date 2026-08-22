import { StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import { LayoutGrid, Boxes, ShieldCheck, Clock } from "lucide-react";

const stats = [
  { value: "7", label: "Role-Based Dashboards", icon: LayoutGrid },
  { value: "40+", label: "Modules — Attendance to Payroll", icon: Boxes },
  { value: "100%", label: "Data Scoped by School (RLS)", icon: ShieldCheck },
  { value: "24/7", label: "Live Product Demo Access", icon: Clock },
];

export function StatsSection() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 mb-4">
                  <s.icon className="h-5 w-5 text-primary-600" />
                </div>
                <p className="text-3xl font-extrabold text-zinc-900 tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
