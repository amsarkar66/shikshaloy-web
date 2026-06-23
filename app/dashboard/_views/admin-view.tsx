import type { User } from "@supabase/supabase-js";
import {
  Users, BookOpen, ClipboardCheck, CreditCard,
  TrendingUp, TrendingDown, UserPlus, FileBarChart,
  Calendar, ChevronRight, CheckCircle2, Clock,
  AlertTriangle, IndianRupee, GraduationCap, Briefcase,
} from "lucide-react";

// ── Mock data — replace with DB queries when tables are ready ─────────────────

const STATS = [
  {
    label: "Total Students",
    value: "1,247",
    sub: "+12 this month",
    trend: "up" as const,
    icon: Users,
    accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15",
  },
  {
    label: "Teaching Staff",
    value: "84",
    sub: "6 on leave today",
    trend: "neutral" as const,
    icon: Briefcase,
    accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15",
  },
  {
    label: "Active Classes",
    value: "36",
    sub: "Across 12 grades",
    trend: "neutral" as const,
    icon: BookOpen,
    accent: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  {
    label: "Today's Attendance",
    value: "94.2%",
    sub: "1,173 / 1,247 present",
    trend: "up" as const,
    icon: ClipboardCheck,
    accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15",
  },
  {
    label: "Fees Collected",
    value: "₹4.2L",
    sub: "June 2026",
    trend: "up" as const,
    icon: IndianRupee,
    accent: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15",
  },
  {
    label: "Pending Dues",
    value: "₹87,500",
    sub: "23 students",
    trend: "down" as const,
    icon: AlertTriangle,
    accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15",
  },
];

const WEEKLY_ATTENDANCE = [
  { day: "Mon", pct: 96, label: "96%" },
  { day: "Tue", pct: 94, label: "94%" },
  { day: "Wed", pct: 92, label: "92%" },
  { day: "Thu", pct: 95, label: "95%" },
  { day: "Fri", pct: 94, label: "94%" },
  { day: "Sat", pct: 0,  label: "—",  off: true },
  { day: "Sun", pct: 94, label: "94%", today: true },
];

const ACTIVITY = [
  {
    icon: ClipboardCheck,
    color: "text-sky-500 bg-sky-500/10",
    title: "23 students marked absent",
    sub: "Class 7A · Attendance submitted",
    time: "2 min ago",
  },
  {
    icon: IndianRupee,
    color: "text-emerald-500 bg-emerald-500/10",
    title: "Fee collected — Priya Sharma",
    sub: "Class 9B · ₹8,500",
    time: "15 min ago",
  },
  {
    icon: UserPlus,
    color: "text-blue-500 bg-blue-500/10",
    title: "New student enrolled",
    sub: "Arjun Mehta · Class 5B",
    time: "1 hr ago",
  },
  {
    icon: FileBarChart,
    color: "text-violet-500 bg-violet-500/10",
    title: "May 2026 attendance report generated",
    sub: "Downloaded by Vice Principal",
    time: "2 hrs ago",
  },
  {
    icon: AlertTriangle,
    color: "text-amber-500 bg-amber-500/10",
    title: "3 students have dues older than 60 days",
    sub: "Action required",
    time: "3 hrs ago",
  },
];

const SCHEDULE = [
  { time: "08:30", label: "School Assembly",           done: true  },
  { time: "09:00", label: "Period 1 — All Grades",     done: true  },
  { time: "10:30", label: "Staff Meeting",              done: false, now: true },
  { time: "13:00", label: "Lunch Break",                done: false },
  { time: "14:30", label: "Parent-Teacher Meet · Gr 10",done: false },
  { time: "16:30", label: "School Closes",              done: false },
];

const QUICK_ACTIONS = [
  { label: "Add Student",       icon: UserPlus,     color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { label: "Mark Attendance",   icon: ClipboardCheck,color:"text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20" },
  { label: "Collect Fee",       icon: CreditCard,   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" },
  { label: "Generate Report",   icon: FileBarChart, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
];

// ── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: typeof STATS[0] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
          <stat.icon className="h-4 w-4" />
        </div>
        {stat.trend === "up" && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
          </span>
        )}
        {stat.trend === "down" && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <TrendingDown className="h-3 w-3" />
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
          {stat.value}
        </p>
        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.label}</p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">{stat.sub}</p>
      </div>
    </div>
  );
}

function AttendanceChart() {
  const maxPct = 100;
  const chartH = 72;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Weekly Attendance</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Jun 9 – Jun 15, 2026</p>
        </div>
        <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-1 rounded-full">
          Avg 94.2%
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 mt-2" style={{ height: chartH + 28 }}>
        {WEEKLY_ATTENDANCE.map((d) => {
          const barH = d.off ? 0 : Math.round((d.pct / maxPct) * chartH);
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Percentage label */}
              <span className={`text-[10px] font-medium ${
                d.off ? "text-gray-300 dark:text-zinc-700" :
                d.today ? "text-sky-600 dark:text-sky-400" :
                "text-gray-500 dark:text-zinc-400"
              }`}>
                {d.label}
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: barH || 4 }}
              >
                <div
                  className={`w-full rounded-t-md ${
                    d.off
                      ? "bg-gray-100 dark:bg-zinc-800"
                      : d.today
                      ? "bg-sky-500"
                      : d.pct >= 95
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : d.pct >= 90
                      ? "bg-blue-400 dark:bg-blue-500"
                      : "bg-amber-400 dark:bg-amber-500"
                  }`}
                  style={{ height: barH || 4 }}
                />
              </div>

              {/* Day label */}
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                d.today
                  ? "text-sky-600 dark:text-sky-400"
                  : d.off
                  ? "text-gray-300 dark:text-zinc-700"
                  : "text-gray-400 dark:text-zinc-500"
              }`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 dark:border-zinc-700/50 pt-3">
        {[
          { color: "bg-emerald-400", label: "≥95%" },
          { color: "bg-blue-400",    label: "90–94%" },
          { color: "bg-amber-400",   label: "<90%" },
          { color: "bg-sky-500",     label: "Today" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
            <span className={`h-2 w-2 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Activity</p>
        <button className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700/30">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.color}`}>
              <a.icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{a.title}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">{a.sub}</p>
            </div>
            <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-600 whitespace-nowrap pt-0.5">
              {a.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${a.color}`}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeeBreakdown() {
  const collected = 84;
  const pending = 16;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const collectedDash = (collected / 100) * circ;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Collection — June</p>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none"
              stroke="currentColor" strokeWidth="10"
              className="text-gray-100 dark:text-zinc-700"
            />
            <circle cx="44" cy="44" r={r} fill="none"
              stroke="currentColor" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${collectedDash} ${circ}`}
              strokeDashoffset={circ * 0.25}
              className="text-indigo-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-gray-900 dark:text-zinc-50">84%</span>
            <span className="text-[9px] text-gray-400 dark:text-zinc-500">collected</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-zinc-400">Collected</span>
              <span className="font-semibold text-gray-900 dark:text-zinc-50">₹4,20,000</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: "84%" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-zinc-400">Pending</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">₹87,500</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className="h-1.5 rounded-full bg-amber-400" style={{ width: "16%" }} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 pt-0.5">
            Target: ₹5,07,500 · 23 students pending
          </p>
        </div>
      </div>
    </div>
  );
}

function TodaySchedule() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Schedule</p>
        <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      <div className="space-y-1">
        {SCHEDULE.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 rounded-lg px-2 py-2 ${s.now ? "bg-indigo-500/5 dark:bg-indigo-500/10" : ""}`}>
            <span className={`w-10 shrink-0 text-[11px] font-mono font-semibold ${
              s.done ? "text-gray-300 dark:text-zinc-600" :
              s.now  ? "text-indigo-600 dark:text-indigo-400" :
              "text-gray-500 dark:text-zinc-400"
            }`}>
              {s.time}
            </span>
            <div className="flex h-4 w-4 shrink-0 items-center justify-center">
              {s.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : s.now ? (
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600" />
              )}
            </div>
            <span className={`text-xs font-medium ${
              s.done ? "line-through text-gray-400 dark:text-zinc-600" :
              s.now  ? "text-indigo-700 dark:text-indigo-300" :
              "text-gray-700 dark:text-zinc-300"
            }`}>
              {s.label}
            </span>
            {s.now && (
              <span className="ml-auto text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                Now
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AdminView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0]
    || user.email?.split("@")[0]
    || "Principal";
  const institution = (user.user_metadata?.institution_name as string) ?? null;

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
            {getGreeting()}, {name} 👋
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
            {institution && <span className="mr-2 text-indigo-600 dark:text-indigo-400">{institution} ·</span>}
            {formatDate()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceChart />
          <RecentActivity />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <QuickActions />
          <FeeBreakdown />
          <TodaySchedule />
        </div>

      </div>
    </div>
  );
}
