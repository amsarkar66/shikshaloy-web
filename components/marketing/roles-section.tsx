import {
  Crown,
  Building2,
  GraduationCap,
  Heart,
  BookOpen,
} from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const roles = [
  {
    icon: Crown,
    role: "Super Admin",
    desc: "Full platform control — manage schools, subscriptions, platform settings, and get bird's-eye analytics across all institutions.",
    items: ["Multi-school management", "Subscription & billing", "Platform analytics", "Global settings"],
    accent: "text-violet-600 bg-violet-50",
  },
  {
    icon: Building2,
    role: "Admin",
    desc: "Run your school effortlessly — manage staff, students, fees, timetables, and everything else from one clean interface.",
    items: ["Student & staff management", "Fee & expense tracking", "Timetable builder", "Reports & compliance"],
    accent: "text-primary-600 bg-primary-50",
  },
  {
    icon: GraduationCap,
    role: "Teacher",
    desc: "Focus on teaching while we handle the admin — track attendance, assign homework, grade exams, and message parents.",
    items: ["Digital attendance", "Homework & assignments", "Exam & grading", "Parent communication"],
    accent: "text-sky-600 bg-sky-50",
  },
  {
    icon: Heart,
    role: "Parent",
    desc: "Stay connected with your child's school in real-time — attendance, results, fees, and teacher messages all in one place.",
    items: ["Live attendance alerts", "Result & report card", "Online fee payment", "Direct teacher chat"],
    accent: "text-rose-600 bg-rose-50",
  },
  {
    icon: BookOpen,
    role: "Student",
    desc: "A personal learning hub — view timetables, submit assignments, check results, and stay on top of school life.",
    items: ["Class timetable", "Assignments & notes", "Exam results", "Announcements"],
    accent: "text-amber-600 bg-amber-50",
  },
];

export function RolesSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Built for Everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            One platform, five experiences
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            Each role gets a dedicated, purpose-built experience — no clutter,
            no confusion.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => (
            <StaggerItem key={r.role}>
              <div className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 transition-all duration-300 h-full">
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 ${r.accent}`}>
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{r.role}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{r.desc}</p>
                <ul className="space-y-2">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
          <div className="hidden lg:block" />
        </StaggerChildren>
      </div>
    </section>
  );
}
