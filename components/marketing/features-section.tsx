import {
  BookOpen,
  Users,
  BarChart3,
  Bell,
  CreditCard,
  Calendar,
  FileText,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const features = [
  {
    icon: Users,
    title: "Role-Based Access",
    desc: "Dedicated portals for Super Admin, Admin, Teacher, Parent, and Student — each with exactly the tools they need.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Real-time dashboards, attendance trends, exam performance, and financial reports at a glance.",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    desc: "Manage classes, subjects, timetables, homework, and syllabus — all in one place.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Instant alerts for attendance, exam results, fee dues, and announcements via app and email.",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    desc: "Online fee collection, automated receipts, payment reminders, and expense tracking.",
  },
  {
    icon: Calendar,
    title: "Attendance System",
    desc: "Digital attendance for students and staff with real-time parent notifications and reports.",
  },
  {
    icon: FileText,
    title: "Exam & Results",
    desc: "Create exams, manage marks, generate report cards, and publish results instantly.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    desc: "In-app messaging between teachers, parents, and admin — no more WhatsApp chaos.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    desc: "Enterprise-grade security with role permissions, audit logs, and data privacy built in.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-zinc-50/60 py-24 sm:py-32 border-y border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Powerful features for every role
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            From daily attendance to end-of-year reports — Shikshaloy handles
            it all so your school can focus on education.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 hover:-translate-y-0.5 transition-all duration-300 h-full">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
                  <f.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
