"use client";

import { useState } from "react";
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
import { FadeIn } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

const roles = [
  {
    slug: "super_admin",
    icon: Crown,
    role: "Super Admin",
    desc: "Full platform control — manage schools, subscriptions, platform settings, and get bird's-eye analytics across all institutions.",
    items: ["Multi-school management", "Subscription & billing", "Platform analytics", "Global settings"],
  },
  {
    slug: "admin",
    icon: Landmark,
    role: "Admin",
    desc: "Run your school effortlessly — manage staff, students, fees, timetables, and everything else from one clean interface.",
    items: ["Student & staff management", "Fee & expense tracking", "Timetable builder", "Reports & compliance"],
  },
  {
    slug: "teacher",
    icon: GraduationCap,
    role: "Teacher",
    desc: "Focus on teaching while we handle the admin — track attendance, assign homework, grade exams, and message parents.",
    items: ["Digital attendance", "Homework & assignments", "Exam & grading", "Parent communication"],
  },
  {
    slug: "staff",
    icon: Briefcase,
    role: "Staff",
    desc: "Purpose-built workspaces for every non-teaching role — librarians, wardens, accountants, HR, front desk, and lab staff.",
    items: ["Role-specific workspace", "Attendance & leave", "Documents & announcements", "Scoped permissions"],
  },
  {
    slug: "student",
    icon: BookOpen,
    role: "Student",
    desc: "A personal learning hub — view timetables, submit assignments, check results, and stay on top of school life.",
    items: ["Class timetable", "Assignments & notes", "Exam results", "Announcements"],
  },
  {
    slug: "parent",
    icon: Heart,
    role: "Parent",
    desc: "Stay connected with your child's school in real-time — attendance, results, fees, and teacher messages all in one place.",
    items: ["Live attendance alerts", "Result & report card", "Online fee payment", "Direct teacher chat"],
  },
  {
    slug: "driver",
    icon: Bus,
    role: "Driver",
    desc: "Stay on schedule and keep parents informed — manage routes, mark transport attendance, and message the school directly.",
    items: ["Route & stop details", "Transport attendance", "Direct messaging", "Leave requests"],
  },
];

export function RolesTabsSection() {
  const [activeSlug, setActiveSlug] = useState(roles[1].slug);
  const active = roles.find((r) => r.slug === activeSlug) ?? roles[0];

  return (
    <section className="relative bg-white py-24 sm:py-32 overflow-hidden">
      <div className="absolute top-1/3 right-[-10%] w-[500px] h-[500px] bg-primary-50 rounded-full blur-3xl pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Built for Everyone
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            One platform, seven experiences
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            Each role gets a dedicated, purpose-built experience — no clutter,
            no confusion. Pick one to see what it unlocks.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="grid lg:grid-cols-[280px_1fr] gap-3 lg:gap-6">
          {/* Role list */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {roles.map((r) => {
              const isActive = r.slug === activeSlug;
              return (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => setActiveSlug(r.slug)}
                  className={cn(
                    "group flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 lg:w-full",
                    isActive
                      ? "bg-primary-50 ring-1 ring-primary-200"
                      : "hover:bg-zinc-50 ring-1 ring-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-primary-600 text-white" : "bg-zinc-100 text-zinc-500"
                    )}
                  >
                    <r.icon className="h-4.5 w-4.5" />
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-sm font-semibold",
                      isActive ? "text-primary-700" : "text-zinc-600"
                    )}
                  >
                    {r.role}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active role panel */}
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50/60 p-8 sm:p-10">
            <span className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-500 text-white mb-6 shadow-sm">
              <active.icon className="h-6 w-6" />
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">{active.role}</h3>
            <p className="text-zinc-500 leading-relaxed max-w-lg text-balance">{active.desc}</p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {active.items.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href={`/demo#${active.slug}`}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Try the {active.role} demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
