import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Users, BookOpen, ClipboardCheck, CreditCard,
  TrendingUp, TrendingDown, UserPlus, FileBarChart,
  Calendar, ChevronRight, CheckCircle2, Clock,
  AlertTriangle, IndianRupee, Briefcase,
} from "lucide-react";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";

// ── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatCurrency(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Stat {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
  accent: string;
}

interface ClassAttendanceRow {
  label: string;
  value: number;
}

interface ActivityItem {
  icon: React.ElementType;
  color: string;
  title: string;
  sub: string;
  time: string;
}

interface ScheduleItem {
  time: string;
  label: string;
  done: boolean;
  now: boolean;
}

const ACTION_ICON: Record<string, React.ElementType> = {
  create: UserPlus, update: ClipboardCheck, delete: AlertTriangle,
  approve: CheckCircle2, reject: AlertTriangle, login: Clock,
};
const MODULE_COLOR: Record<string, string> = {
  Fees: "text-emerald-500 bg-emerald-500/10",
  Attendance: "text-sky-500 bg-sky-500/10",
  Students: "text-blue-500 bg-blue-500/10",
  Staff: "text-violet-500 bg-violet-500/10",
  Leave: "text-amber-500 bg-amber-500/10",
  Settings: "text-gray-500 bg-gray-500/10",
  Admissions: "text-blue-500 bg-blue-500/10",
  Announcements: "text-violet-500 bg-violet-500/10",
};

const QUICK_ACTIONS = [
  { label: "Add Student",     icon: UserPlus,      href: "/dashboard/students",  color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { label: "Mark Attendance", icon: ClipboardCheck, href: "/dashboard/attendance", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20" },
  { label: "Collect Fee",     icon: CreditCard,     href: "/dashboard/fees",      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" },
  { label: "Generate Report", icon: FileBarChart,   href: "/dashboard/reports",   color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: Stat }) {
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

function ClassAttendanceChart({ data, avgPct }: { data: ClassAttendanceRow[]; avgPct: number }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Attendance by Class</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Live average, by section</p>
        </div>
        <span className="text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-1 rounded-full">
          Avg {avgPct}%
        </span>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No students enrolled yet</p>
      ) : (
        <div className="space-y-2.5">
          {data.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-gray-600 dark:text-zinc-400">{c.label}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div
                  className={`h-2 rounded-full ${
                    c.value >= 95 ? "bg-emerald-400 dark:bg-emerald-500"
                    : c.value >= 90 ? "bg-blue-400 dark:bg-blue-500"
                    : "bg-amber-400 dark:bg-amber-500"
                  }`}
                  style={{ width: `${c.value}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-600 dark:text-zinc-400">{c.value}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 dark:border-zinc-700/50 pt-3">
        {[
          { color: "bg-emerald-400", label: "≥95%" },
          { color: "bg-blue-400",    label: "90–94%" },
          { color: "bg-amber-400",   label: "<90%" },
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

function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Activity</p>
        <Link href="/dashboard/audit-log" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No activity recorded yet</p>
      ) : (
        <div className="space-y-1">
          {items.map((a, i) => (
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
      )}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${a.color}`}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeeBreakdown({
  monthLabel, collected, due,
}: {
  monthLabel: string;
  collected: number;
  due: number;
}) {
  const pct = due > 0 ? Math.round((collected / due) * 100) : 0;
  const pending = Math.max(due - collected, 0);
  const pendingPct = due > 0 ? Math.round((pending / due) * 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const collectedDash = (pct / 100) * circ;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Collection — {monthLabel}</p>

      {due === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No fee data yet</p>
      ) : (
        <div className="flex items-center gap-5">
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
              <span className="text-base font-bold text-gray-900 dark:text-zinc-50">{pct}%</span>
              <span className="text-[9px] text-gray-400 dark:text-zinc-500">collected</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-zinc-400">Collected</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-50">{formatCurrency(collected)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-zinc-400">Pending</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(pending)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 pt-0.5">
              Target: {formatCurrency(due)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TodaySchedule({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Schedule</p>
        <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">Nothing scheduled today</p>
      ) : (
        <div className="space-y-1">
          {items.map((s, i) => (
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
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function AdminView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0]
    || user.email?.split("@")[0]
    || "Principal";
  const institution = (user.user_metadata?.institution_name as string) ?? null;

  const todayISO = new Date().toISOString().slice(0, 10);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const [
    { count: totalStudents },
    { count: teachingStaffCount },
    { count: onLeaveCount },
    { data: studentRows },
    { data: feeRows },
    { data: auditRows },
    { data: periodRows },
    { data: eventRows },
    { data: ptmRows },
  ] = await Promise.all([
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }).eq("school_id", DEMO_SCHOOL_ID),

    supabaseAdmin.from("staff_members").select("id", { count: "exact", head: true })
      .eq("school_id", DEMO_SCHOOL_ID).eq("type", "teaching"),

    supabaseAdmin.from("leave_requests").select("id", { count: "exact", head: true })
      .eq("school_id", DEMO_SCHOOL_ID).eq("status", "approved")
      .lte("from_date", todayISO).gte("to_date", todayISO),

    supabaseAdmin.from("students")
      .select("attendance_pct, sections ( name, grades ( level ) )")
      .eq("school_id", DEMO_SCHOOL_ID),

    supabaseAdmin.from("fee_payments")
      .select("student_id, month_str, amount_due, amount_paid")
      .eq("school_id", DEMO_SCHOOL_ID),

    supabaseAdmin.from("audit_log")
      .select("action, module, description, actor_name, actor_role, created_at")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("created_at", { ascending: false })
      .limit(5),

    supabaseAdmin.from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("start_time"),

    supabaseAdmin.from("school_events")
      .select("title, time, end_time, is_all_day")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("date", todayISO),

    supabaseAdmin.from("ptm_sessions")
      .select("start_time, end_time, sections ( name, grades ( level ) )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("date", todayISO),
  ]);

  // ── Students / classes / attendance ─────────────────────────
  const students = (studentRows ?? []) as any[];
  const avgAttendance = students.length
    ? Math.round((students.reduce((s, x) => s + Number(x.attendance_pct ?? 0), 0) / students.length) * 10) / 10
    : 0;

  const bySection: Record<string, { sum: number; count: number }> = {};
  const grades = new Set<number>();
  for (const s of students) {
    const level = s.sections?.grades?.level;
    if (level) grades.add(level);
    const label = `${level ?? "?"}-${s.sections?.name ?? ""}`;
    (bySection[label] ??= { sum: 0, count: 0 });
    bySection[label].sum += Number(s.attendance_pct ?? 0);
    bySection[label].count += 1;
  }
  const classAttendance: ClassAttendanceRow[] = Object.entries(bySection)
    .map(([label, { sum, count }]) => ({ label: `Class ${label}`, value: Math.round((sum / count) * 10) / 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ── Fees ─────────────────────────────────────────────────────
  const fees = (feeRows ?? []) as any[];
  const byMonth: Record<string, { due: number; paid: number }> = {};
  for (const f of fees) {
    (byMonth[f.month_str] ??= { due: 0, paid: 0 });
    byMonth[f.month_str].due += Number(f.amount_due ?? 0);
    byMonth[f.month_str].paid += Number(f.amount_paid ?? 0);
  }
  const months = Object.keys(byMonth).sort();
  const latestMonth = months[months.length - 1];
  const latest = latestMonth ? byMonth[latestMonth] : { due: 0, paid: 0 };
  const latestMonthLabel = latestMonth
    ? new Date(latestMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  const totalDue = Object.values(byMonth).reduce((s, m) => s + m.due, 0);
  const totalPaid = Object.values(byMonth).reduce((s, m) => s + m.paid, 0);
  const totalPending = Math.max(totalDue - totalPaid, 0);

  const byStudent: Record<string, { due: number; paid: number }> = {};
  for (const f of fees) {
    const sid = f.student_id;
    (byStudent[sid] ??= { due: 0, paid: 0 });
    byStudent[sid].due += Number(f.amount_due ?? 0);
    byStudent[sid].paid += Number(f.amount_paid ?? 0);
  }
  const studentsWithDues = Object.values(byStudent).filter((s) => s.due > s.paid).length;

  // ── Stats ──────────────────────────────────────────────────
  const stats: Stat[] = [
    {
      label: "Total Students", value: (totalStudents ?? 0).toLocaleString("en-IN"),
      sub: `Across ${grades.size} grade${grades.size !== 1 ? "s" : ""}`, trend: "neutral",
      icon: Users, accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      label: "Teaching Staff", value: String(teachingStaffCount ?? 0),
      sub: `${onLeaveCount ?? 0} on leave today`, trend: "neutral",
      icon: Briefcase, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15",
    },
    {
      label: "Active Classes", value: String(Object.keys(bySection).length),
      sub: `Across ${grades.size} grade${grades.size !== 1 ? "s" : ""}`, trend: "neutral",
      icon: BookOpen, accent: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      label: "Avg Attendance", value: `${avgAttendance}%`,
      sub: "Across all students", trend: "up",
      icon: ClipboardCheck, accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15",
    },
    {
      label: "Fees Collected", value: formatCurrency(latest.paid),
      sub: latestMonthLabel, trend: "up",
      icon: IndianRupee, accent: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15",
    },
    {
      label: "Pending Dues", value: formatCurrency(totalPending),
      sub: `${studentsWithDues} student${studentsWithDues !== 1 ? "s" : ""}`, trend: "down",
      icon: AlertTriangle, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15",
    },
  ];

  // ── Recent activity (from audit_log) ────────────────────────
  const activity: ActivityItem[] = ((auditRows ?? []) as any[]).map((a) => ({
    icon: ACTION_ICON[a.action] ?? ClipboardCheck,
    color: MODULE_COLOR[a.module] ?? "text-gray-500 bg-gray-500/10",
    title: a.description,
    sub: `${a.actor_name} · ${a.module}`,
    time: formatRelativeTime(a.created_at),
  }));

  // ── Today's schedule (real periods + events + PTM) ──────────
  const scheduleItems: { time: string; label: string; startMin: number; endMin: number }[] = [];
  for (const p of (periodRows ?? []) as any[]) {
    const [h, m] = p.start_time.split(":").map(Number);
    const [eh, em] = p.end_time.split(":").map(Number);
    scheduleItems.push({
      time: p.start_time.slice(0, 5),
      label: p.is_break ? (p.break_label ?? "Break") : `Period ${p.number}`,
      startMin: h * 60 + m,
      endMin: eh * 60 + em,
    });
  }
  for (const e of (eventRows ?? []) as any[]) {
    if (e.is_all_day || !e.time) continue;
    const [h, m] = e.time.split(":").map(Number);
    const end = e.end_time ? e.end_time.split(":").map(Number) : [h, m + 30];
    scheduleItems.push({
      time: e.time.slice(0, 5), label: e.title,
      startMin: h * 60 + m, endMin: end[0] * 60 + end[1],
    });
  }
  for (const s of (ptmRows ?? []) as any[]) {
    const [h, m] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    const label = `PTM — Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`;
    scheduleItems.push({ time: s.start_time.slice(0, 5), label, startMin: h * 60 + m, endMin: eh * 60 + em });
  }
  scheduleItems.sort((a, b) => a.startMin - b.startMin);
  const schedule: ScheduleItem[] = scheduleItems.map((s) => ({
    time: s.time, label: s.label,
    done: nowMinutes >= s.endMin,
    now: nowMinutes >= s.startMin && nowMinutes < s.endMin,
  }));

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
            {formatHeaderDate()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <ClassAttendanceChart data={classAttendance} avgPct={avgAttendance} />
          <RecentActivity items={activity} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <QuickActions />
          <FeeBreakdown monthLabel={latestMonthLabel} collected={latest.paid} due={latest.due} />
          <TodaySchedule items={schedule} />
        </div>

      </div>
    </div>
  );
}
