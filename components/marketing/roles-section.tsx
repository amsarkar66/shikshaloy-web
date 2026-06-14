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
    color: "from-violet-500 to-purple-600",
    items: ["Multi-school management", "Subscription & billing", "Platform analytics", "Global settings"],
  },
  {
    icon: Building2,
    role: "Admin",
    desc: "Run your school effortlessly — manage staff, students, fees, timetables, and everything else from one clean interface.",
    color: "from-indigo-500 to-blue-600",
    items: ["Student & staff management", "Fee & expense tracking", "Timetable builder", "Reports & compliance"],
  },
  {
    icon: GraduationCap,
    role: "Teacher",
    desc: "Focus on teaching while we handle the admin — track attendance, assign homework, grade exams, and message parents.",
    color: "from-blue-500 to-cyan-600",
    items: ["Digital attendance", "Homework & assignments", "Exam & grading", "Parent communication"],
  },
  {
    icon: Heart,
    role: "Parent",
    desc: "Stay connected with your child's school in real-time — attendance, results, fees, and teacher messages all in one place.",
    color: "from-rose-500 to-pink-600",
    items: ["Live attendance alerts", "Result & report card", "Online fee payment", "Direct teacher chat"],
  },
  {
    icon: BookOpen,
    role: "Student",
    desc: "A personal learning hub — view timetables, submit assignments, check results, and stay on top of school life.",
    color: "from-emerald-500 to-teal-600",
    items: ["Class timetable", "Assignments & notes", "Exam results", "Announcements"],
  },
];

export function RolesSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Built for Everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            One Platform, Five Experiences
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            Each role gets a dedicated, purpose-built experience — no clutter,
            no confusion.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r) => (
            <StaggerItem key={r.role}>
              <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 h-full">
                <div className={`h-2 w-full bg-gradient-to-r ${r.color}`} />
                <div className="p-6">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${r.color} mb-4`}>
                    <r.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{r.role}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{r.desc}</p>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${r.color} flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </StaggerItem>
          ))}
          <div className="hidden lg:block" />
        </StaggerChildren>
      </div>
    </section>
  );
}
