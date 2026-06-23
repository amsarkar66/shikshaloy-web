import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Landmark, Users, GraduationCap, Briefcase,
  TrendingUp, TrendingDown, CreditCard, FileBarChart,
  Plus, Settings, ChevronRight, CheckCircle2,
  MapPin, AlertTriangle, Bell, Building2,
  UserCog, BadgeCheck, Clock,
} from "lucide-react";

// ── Mock data — replace with DB queries when tables are ready ─────────────────

const STATS = [
  {
    label: "Schools",
    value: "3",
    sub: "All operational",
    trend: "neutral" as const,
    icon: Landmark,
    accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15",
  },
  {
    label: "Total Students",
    value: "3,741",
    sub: "+34 this month",
    trend: "up" as const,
    icon: GraduationCap,
    accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15",
  },
  {
    label: "Teaching Staff",
    value: "252",
    sub: "Across all schools",
    trend: "neutral" as const,
    icon: Briefcase,
    accent: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  {
    label: "Avg Attendance",
    value: "93.8%",
    sub: "Today, all schools",
    trend: "up" as const,
    icon: CheckCircle2,
    accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15",
  },
  {
    label: "Monthly Revenue",
    value: "₹12.4L",
    sub: "June 2026",
    trend: "up" as const,
    icon: CreditCard,
    accent: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15",
  },
  {
    label: "Pending Dues",
    value: "₹2.1L",
    sub: "68 students",
    trend: "down" as const,
    icon: AlertTriangle,
    accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15",
  },
];

const SCHOOLS = [
  {
    name: "Sunrise Academy — Main Campus",
    location: "Kolkata, West Bengal",
    students: 1584,
    staff: 108,
    principal: "Dr. Subrata Roy",
    attendance: 95,
    feePct: 87,
    status: "active" as const,
  },
  {
    name: "Sunrise Academy — Salt Lake",
    location: "Salt Lake, West Bengal",
    students: 1247,
    staff: 84,
    principal: "Mrs. Anita Ghosh",
    attendance: 93,
    feePct: 82,
    status: "active" as const,
  },
  {
    name: "Sunrise Academy — Howrah",
    location: "Howrah, West Bengal",
    students: 910,
    staff: 60,
    principal: "Mr. Rajesh Sharma",
    attendance: 91,
    feePct: 76,
    status: "active" as const,
  },
];

const ACTIVITY = [
  {
    icon: GraduationCap,
    color: "text-blue-500 bg-blue-500/10",
    title: "12 new students enrolled",
    sub: "Sunrise Academy — Salt Lake",
    time: "30 min ago",
  },
  {
    icon: CreditCard,
    color: "text-emerald-500 bg-emerald-500/10",
    title: "Fee batch collected — ₹84,000",
    sub: "Sunrise Academy — Main Campus",
    time: "2 hrs ago",
  },
  {
    icon: UserCog,
    color: "text-violet-500 bg-violet-500/10",
    title: "New staff member added",
    sub: "Sunrise Academy — Howrah · Science Dept.",
    time: "4 hrs ago",
  },
  {
    icon: Bell,
    color: "text-amber-500 bg-amber-500/10",
    title: "Low attendance alert — Class 8C",
    sub: "Sunrise Academy — Main Campus",
    time: "5 hrs ago",
  },
  {
    icon: FileBarChart,
    color: "text-indigo-500 bg-indigo-500/10",
    title: "May 2026 report published",
    sub: "All schools",
    time: "Yesterday",
  },
];

const QUICK_ACTIONS = [
  {
    label: "Add School",
    icon: Plus,
    color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20",
  },
  {
    label: "Manage Admins",
    icon: UserCog,
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
  },
  {
    label: "View Billing",
    icon: CreditCard,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
  },
  {
    label: "Reports",
    icon: FileBarChart,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20",
  },
];

const SUBSCRIPTION = {
  plan: "Institution Pro",
  status: "active" as const,
  schools: 3,
  maxSchools: 5,
  renewsOn: "15 Jan 2027",
  monthlyFee: "₹12,000/mo",
};

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

function SchoolCard({ school }: { school: typeof SCHOOLS[0] }) {
  const attendanceColor =
    school.attendance >= 95 ? "bg-emerald-500" :
    school.attendance >= 90 ? "bg-blue-500" : "bg-amber-500";
  const feeColor =
    school.feePct >= 85 ? "bg-emerald-500" :
    school.feePct >= 75 ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Landmark className="h-4 w-4" />
            </div>
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">
              {school.name}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-indigo-400" />
              {school.location}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-blue-400" />
              {school.students.toLocaleString()} students
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-emerald-400" />
              {school.staff} staff
            </span>
          </div>

          <p className="mt-1.5 text-xs text-indigo-500 dark:text-zinc-500">
            Principal: {school.principal}
          </p>
        </div>

        <span className="shrink-0 flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <BadgeCheck className="h-3 w-3" />
          Active
        </span>
      </div>

      {/* Mini metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gray-500 dark:text-zinc-400">Attendance</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">{school.attendance}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-1.5 rounded-full ${attendanceColor}`} style={{ width: `${school.attendance}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-gray-500 dark:text-zinc-400">Fee collection</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">{school.feePct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className={`h-1.5 rounded-full ${feeColor}`} style={{ width: `${school.feePct}%` }} />
          </div>
        </div>
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

function SubscriptionCard() {
  const usedPct = (SUBSCRIPTION.schools / SUBSCRIPTION.maxSchools) * 100;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subscription</p>
        <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-zinc-50">{SUBSCRIPTION.plan}</p>
          <p className="text-xs text-indigo-500 dark:text-zinc-400">{SUBSCRIPTION.monthlyFee}</p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-zinc-400">Schools used</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">
              {SUBSCRIPTION.schools} / {SUBSCRIPTION.maxSchools}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div
              className="h-2 rounded-full bg-violet-500"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
            {SUBSCRIPTION.maxSchools - SUBSCRIPTION.schools} school slot{SUBSCRIPTION.maxSchools - SUBSCRIPTION.schools !== 1 ? "s" : ""} remaining
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-xs text-gray-600 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          Renews on {SUBSCRIPTION.renewsOn}
        </div>

        <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors">
          <Settings className="h-3.5 w-3.5" />
          Manage Plan
        </button>
      </div>
    </div>
  );
}

function InstituteOverviewBar() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Revenue — June 2026</p>
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">
          ₹12.4L total
        </span>
      </div>
      <div className="space-y-3">
        {SCHOOLS.map((s) => {
          const rev = s.students * 350;
          const maxRev = SCHOOLS[0].students * 350;
          const pct = Math.round((rev / maxRev) * 100);
          const colors = ["bg-violet-500", "bg-blue-500", "bg-indigo-500"];
          const colorIdx = SCHOOLS.indexOf(s);
          return (
            <div key={s.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-zinc-400 truncate max-w-[60%]">
                  {s.name.split("—")[1]?.trim() ?? s.name}
                </span>
                <span className="font-semibold text-gray-700 dark:text-zinc-300">
                  ₹{(rev / 100000).toFixed(1)}L
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div className={`h-1.5 rounded-full ${colors[colorIdx]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SuperAdminView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0]
    || user.email?.split("@")[0]
    || "Owner";
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
            {institution && (
              <span className="mr-2 text-violet-600 dark:text-violet-400 font-medium">
                {institution} ·
              </span>
            )}
            {formatDate()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Building2 className="h-3.5 w-3.5" />
          {SCHOOLS.length} schools
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      {/* Schools */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Your Schools</h3>
          <Link
            href="/dashboard/schools/new"
            className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            <Plus className="h-3 w-3" /> Add school
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SCHOOLS.map((s) => <SchoolCard key={s.name} school={s} />)}
        </div>
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Activity */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity />
          <InstituteOverviewBar />
        </div>

        {/* Right: Quick actions + Subscription */}
        <div className="space-y-5">
          <QuickActions />
          <SubscriptionCard />
        </div>

      </div>
    </div>
  );
}
