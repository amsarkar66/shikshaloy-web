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
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    desc: "Real-time dashboards, attendance trends, exam performance, and financial reports at a glance.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    desc: "Manage classes, subjects, timetables, homework, and syllabus — all in one place.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Instant alerts for attendance, exam results, fee dues, and announcements via app and email.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    desc: "Online fee collection, automated receipts, payment reminders, and expense tracking.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Calendar,
    title: "Attendance System",
    desc: "Digital attendance for students and staff with real-time parent notifications and reports.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: FileText,
    title: "Exam & Results",
    desc: "Create exams, manage marks, generate report cards, and publish results instantly.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    desc: "In-app messaging between teachers, parents, and admin — no more WhatsApp chaos.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    desc: "Enterprise-grade security with role permissions, audit logs, and data privacy built in.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Powerful Features for Every Role
          </h2>
          <p className="mt-4 text-slate-500 max-w-xl mx-auto">
            From daily attendance to end-of-year reports — Shikshaloy handles
            it all so your school can focus on education.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group rounded-2xl border border-slate-100 bg-white p-6 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 h-full">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${f.bg} mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
