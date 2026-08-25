import Link from "next/link";
import {
  Crown,
  Landmark,
  GraduationCap,
  Briefcase,
  BookOpen,
  Heart,
  Bus,
  ArrowRight,
} from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const roles = [
  {
    slug: "super_admin",
    icon: Crown,
    role: "Super Admin",
    desc: "Full platform control — manage schools, subscriptions, platform settings, and get bird's-eye analytics across all institutions.",
    items: ["Multi-school management", "Subscription & billing", "Platform analytics", "Global settings"],
    accent: "text-violet-600 bg-violet-50",
  },
  {
    slug: "admin",
    icon: Landmark,
    role: "Admin",
    desc: "Run your school effortlessly — manage staff, students, fees, timetables, and everything else from one clean interface.",
    items: ["Student & staff management", "Fee & expense tracking", "Timetable builder", "Reports & compliance"],
    accent: "text-primary-600 bg-primary-50",
  },
  {
    slug: "teacher",
    icon: GraduationCap,
    role: "Teacher",
    desc: "Focus on teaching while we handle the admin — track attendance, assign homework, grade exams, and message parents.",
    items: ["Digital attendance", "Homework & assignments", "Exam & grading", "Parent communication"],
    accent: "text-sky-600 bg-sky-50",
  },
  {
    slug: "staff",
    icon: Briefcase,
    role: "Staff",
    desc: "Purpose-built workspaces for every non-teaching role — librarians, wardens, accountants, HR, front desk, and lab staff.",
    items: ["Role-specific workspace", "Attendance & leave", "Documents & announcements", "Scoped permissions"],
    accent: "text-orange-600 bg-orange-50",
  },
  {
    slug: "student",
    icon: BookOpen,
    role: "Student",
    desc: "A personal learning hub — view timetables, submit assignments, check results, and stay on top of school life.",
    items: ["Class timetable", "Assignments & notes", "Exam results", "Announcements"],
    accent: "text-amber-600 bg-amber-50",
  },
  {
    slug: "parent",
    icon: Heart,
    role: "Parent",
    desc: "Stay connected with your child's school in real-time — attendance, results, fees, and teacher messages all in one place.",
    items: ["Live attendance alerts", "Result & report card", "Online fee payment", "Direct teacher chat"],
    accent: "text-rose-600 bg-rose-50",
  },
  {
    slug: "driver",
    icon: Bus,
    role: "Driver",
    desc: "Stay on schedule and keep parents informed — manage routes, mark transport attendance, and message the school directly.",
    items: ["Route & stop details", "Transport attendance", "Direct messaging", "Leave requests"],
    accent: "text-teal-600 bg-teal-50",
  },
];

export function RolesSection() {
  return (
    <section className="relative bg-white py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-primary-50 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Built for Everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            One platform, seven experiences
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            Each role gets a dedicated, purpose-built experience — no clutter,
            no confusion. Try any of them live, right now.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => (
            <StaggerItem key={r.role}>
              <div className="group rounded-2xl bg-white border border-zinc-200 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110 ${r.accent}`}>
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">{r.role}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-4">{r.desc}</p>
                <ul className="space-y-2 mb-5">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/demo#${r.slug}`}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Try the {r.role} demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
