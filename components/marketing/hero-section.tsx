"use client";

import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Sparkles,
  LayoutGrid,
  Users,
  Calendar,
  Wallet,
  FileBarChart,
  Settings,
  BellRing,
  ClipboardCheck,
} from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { FloatingBadge } from "@/components/marketing/floating-badge";
import { PlayStoreBadge } from "@/components/marketing/play-store-badge";

const sidebarItems = [
  { icon: LayoutGrid, label: "Overview", active: true },
  { icon: Users, label: "Students" },
  { icon: Calendar, label: "Attendance" },
  { icon: Wallet, label: "Fees" },
  { icon: FileBarChart, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const statCards = [
  { label: "Students", value: "1,284", tint: "bg-primary-200" },
  { label: "Attendance", value: "96.4%", tint: "bg-sky-200" },
  { label: "Fees collected", value: "₹8.2L", tint: "bg-amber-200" },
];

const chartBars = [38, 62, 45, 78, 54, 90, 66];

const tableRows = [
  { name: "Aarav Sharma", meta: "Class 8 · B", status: "Present", dot: "bg-emerald-400" },
  { name: "Priya Nair", meta: "Class 6 · A", status: "Present", dot: "bg-emerald-400" },
  { name: "Kabir Singh", meta: "Class 9 · C", status: "Leave", dot: "bg-amber-400" },
];

export function HeroSection() {
  return (
    <section className="relative flex items-center bg-white overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Soft gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-primary-200/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[8%] w-[420px] h-[420px] bg-primary-300/30 rounded-full blur-3xl" />
        <div className="absolute top-[10%] right-[5%] w-[380px] h-[380px] bg-amber-200/30 rounded-full blur-3xl" />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]"
        style={{
          backgroundImage: "radial-gradient(circle,#d4d4d8 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0}>
          <Badge className="mb-6 h-auto bg-white text-primary-700 border border-zinc-200 shadow-sm px-4 py-1.5 text-sm gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Modern School Management System
          </Badge>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-zinc-900 leading-[1.05] tracking-tight max-w-5xl mx-auto text-balance">
            The complete platform{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">
              for modern schools
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed text-balance">
            Shikshaloy unifies administration, teaching, parents, and students in
            one powerful platform — built for the way schools actually work.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <FancyButton href="/signup" size="lg">
              Start your free trial
              <ArrowUpRightIcon className="size-5" />
            </FancyButton>
            <FancyButton href="/demo" variant="white" size="lg" className="group">
              <Play className="h-4 w-4 fill-current" />
              Try Live Demo
            </FancyButton>
          </div>
        </FadeIn>

        <FadeIn delay={0.35}>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-zinc-400">Also available on mobile</p>
            <PlayStoreBadge />
          </div>
        </FadeIn>

        {/* Dashboard preview: browser frame + overlapping phone frame */}
        <FadeIn delay={0.45} className="mt-20 relative mx-auto max-w-5xl pb-16 sm:pb-0">
          <FloatingBadge
            icon={ClipboardCheck}
            label="Attendance marked"
            delay={0.9}
            className="left-2 top-[8%] sm:-left-8 hidden sm:flex"
          />
          <FloatingBadge
            icon={BellRing}
            label="₹12,400 fee received"
            delay={1.1}
            className="right-2 top-[8%] sm:-right-8 hidden sm:flex"
          />

          {/* Browser / laptop frame */}
          <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-2xl shadow-zinc-300/40">
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="mx-auto text-xs text-zinc-400">
                shikshaloy.com/dashboard
              </div>
            </div>

            <div className="flex bg-white text-left">
              {/* Sidebar */}
              <div className="hidden sm:flex w-40 md:w-48 shrink-0 flex-col gap-0.5 border-r border-zinc-100 bg-zinc-50/60 p-3">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium ${
                      item.active ? "bg-white text-primary-700 shadow-sm ring-1 ring-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main panel */}
              <div className="flex-1 min-w-0 bg-gradient-to-br from-primary-50/40 to-white p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {statCards.map((s) => (
                    <div key={s.label} className="rounded-xl bg-white border border-zinc-200 p-3 sm:p-4 shadow-sm">
                      <div className={`h-1.5 w-8 rounded-full mb-2 ${s.tint}`} />
                      <p className="text-sm sm:text-lg font-bold text-zinc-900 truncate">{s.value}</p>
                      <p className="text-[10px] sm:text-xs text-zinc-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white border border-zinc-200 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-zinc-500 mb-3">Weekly attendance</p>
                  <div className="flex items-end gap-2 h-20">
                    {chartBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-primary-500 to-primary-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block rounded-xl bg-white border border-zinc-200 divide-y divide-zinc-100 shadow-sm">
                  {tableRows.map((row) => (
                    <div key={row.name} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-b from-primary-300 to-primary-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-800 truncate">{row.name}</p>
                        <p className="text-[10px] text-zinc-400">{row.meta}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phone frame — same dashboard, on mobile */}
          <div className="hidden md:block absolute -bottom-10 -right-4 lg:-right-10 w-36 lg:w-44 rotate-[7deg] z-10">
            <div className="rounded-[1.75rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-400/40">
              <div className="rounded-[1.35rem] overflow-hidden bg-white">
                <div className="h-4 bg-zinc-900 flex items-center justify-center">
                  <div className="h-1 w-8 rounded-full bg-zinc-700" />
                </div>
                <div className="p-2.5 space-y-2 bg-gradient-to-br from-primary-50/50 to-white">
                  <div className="rounded-lg bg-white border border-zinc-200 p-2 shadow-sm">
                    <div className="h-1 w-6 rounded-full bg-primary-200 mb-1.5" />
                    <p className="text-[9px] font-bold text-zinc-900">96.4%</p>
                    <p className="text-[7px] text-zinc-400">Attendance</p>
                  </div>
                  <div className="rounded-lg bg-white border border-zinc-200 p-2 shadow-sm">
                    <div className="h-1 w-6 rounded-full bg-amber-200 mb-1.5" />
                    <p className="text-[9px] font-bold text-zinc-900">₹8.2L</p>
                    <p className="text-[7px] text-zinc-400">Fees collected</p>
                  </div>
                  <div className="flex items-end gap-1 h-8 px-1">
                    {chartBars.slice(0, 5).map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-primary-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-primary-300/30 blur-2xl rounded-full" />
        </FadeIn>

        <FadeIn delay={0.6} className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          One dashboard, fully responsive on web and mobile
        </FadeIn>
      </div>
    </section>
  );
}
