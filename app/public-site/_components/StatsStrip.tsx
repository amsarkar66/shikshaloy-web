import { Calendar, GraduationCap, Users, Award } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { RevealStagger, RevealItem } from "./Reveal";

export function StatsStrip({ school }: { school: PublicSchool }) {
  const stats: { icon: React.ElementType; label: string; value: string }[] = [];

  if (school.establishedYear) {
    const years = new Date().getFullYear() - school.establishedYear;
    stats.push({
      icon: Calendar,
      label: years > 0 ? "Years of Excellence" : "Established",
      value: years > 0 ? `${years}+` : String(school.establishedYear),
    });
  }
  if (school.faculty.length > 0) {
    stats.push({ icon: Users, label: "Expert Faculty", value: `${school.faculty.length}+` });
  }
  if (school.board) {
    stats.push({ icon: Award, label: "Board", value: school.board });
  }
  if (school.principalName) {
    stats.push({ icon: GraduationCap, label: "Principal", value: school.principalName });
  }

  if (stats.length === 0) return null;

  return (
    <div className="relative z-10 mx-auto -mt-12 max-w-5xl px-6 lg:-mt-16">
      <RevealStagger className="flex flex-wrap divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-900/5">
        {stats.map((s) => (
          <RevealItem
            key={s.label}
            className="flex flex-1 basis-1/2 items-center justify-center gap-3 px-4 py-6 sm:basis-0"
          >
            <s.icon className="h-6 w-6 shrink-0 text-primary-600" />
            <div className="min-w-0 text-left">
              <p className="truncate text-base font-bold text-gray-900">{s.value}</p>
              <p className="truncate text-[11px] uppercase tracking-wide text-gray-400">{s.label}</p>
            </div>
          </RevealItem>
        ))}
      </RevealStagger>
    </div>
  );
}
