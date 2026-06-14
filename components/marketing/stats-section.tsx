import { StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const stats = [
  { value: "10,000+", label: "Students Enrolled" },
  { value: "500+", label: "Schools Onboarded" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24/7", label: "Support Available" },
];

export function StatsSection() {
  return (
    <section className="bg-indigo-600 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-indigo-200 text-sm">{s.label}</p>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
