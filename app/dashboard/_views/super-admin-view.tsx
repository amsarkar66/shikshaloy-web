import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Landmark, GraduationCap, Briefcase,
  TrendingUp, TrendingDown, CreditCard, FileBarChart,
  Plus, Settings, ChevronRight, CheckCircle2,
  MapPin, AlertTriangle, UserCog,
  Building2, Clock, ClipboardCheck,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";

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

function formatCurrency(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;
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

// ── Types ──────────────────────────────────────────────────────────────────

interface Stat {
  label: string; value: string; sub: string; trend: "up" | "down" | "neutral";
  icon: React.ElementType; accent: string;
}

interface SchoolSummary {
  id: string; name: string; location: string;
  students: number; staff: number; principal: string;
  attendance: number; feePct: number; monthlyRevenue: number;
}

interface ActivityItem {
  icon: React.ElementType; color: string; title: string; sub: string; time: string;
}

const ACTION_ICON: Record<string, React.ElementType> = {
  create: Plus, update: ClipboardCheck, delete: AlertTriangle,
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
  { label: "Add School",     icon: Plus,     href: "/dashboard/schools/new", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
  { label: "Manage Staff",   icon: UserCog,  href: "/dashboard/staff",       color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { label: "View Billing",   icon: CreditCard, href: "/dashboard/billing",   color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" },
  { label: "Reports",        icon: FileBarChart, href: "/dashboard/reports", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20" },
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

function SchoolCard({ school }: { school: SchoolSummary }) {
  const attendanceColor =
    school.attendance >= 95 ? "bg-emerald-500" :
    school.attendance >= 90 ? "bg-blue-500" : "bg-amber-500";
  const feeColor =
    school.feePct >= 85 ? "bg-emerald-500" :
    school.feePct >= 75 ? "bg-blue-500" : "bg-amber-500";

  return (
    <Link
      href="/dashboard/schools"
      className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 block"
    >
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
            {school.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-indigo-400" />
                {school.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-blue-400" />
              {school.students.toLocaleString("en-IN")} students
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
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      </div>

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
    </Link>
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

function SubscriptionCard({
  subscription,
}: {
  subscription: {
    planName: string; status: string; monthlyFee: number;
    schoolsUsed: number; maxSchools: number; renewsOn: string;
  } | null;
}) {
  if (!subscription) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 mb-2">Subscription</p>
        <p className="text-sm text-gray-400 dark:text-zinc-500">No subscription on file.</p>
      </div>
    );
  }

  const usedPct = subscription.maxSchools ? (subscription.schoolsUsed / subscription.maxSchools) * 100 : 0;
  const remaining = subscription.maxSchools - subscription.schoolsUsed;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subscription</p>
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          subscription.status === "active"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
        }`}>
          <CheckCircle2 className="h-3 w-3" />
          {subscription.status === "active" ? "Active" : subscription.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-zinc-50">{subscription.planName}</p>
          <p className="text-xs text-indigo-500 dark:text-zinc-400">{formatCurrency(subscription.monthlyFee)}/mo</p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500 dark:text-zinc-400">Schools used</span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">
              {subscription.schoolsUsed} / {subscription.maxSchools}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className="h-2 rounded-full bg-violet-500" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
            {remaining} school slot{remaining !== 1 ? "s" : ""} remaining
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-xs text-gray-600 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          Renews on {new Date(subscription.renewsOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>

        <Link href="/dashboard/billing" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors">
          <Settings className="h-3.5 w-3.5" />
          Manage Plan
        </Link>
      </div>
    </div>
  );
}

function RevenueBar({ schools, monthLabel }: { schools: SchoolSummary[]; monthLabel: string }) {
  const total = schools.reduce((s, x) => s + x.monthlyRevenue, 0);
  const maxRev = Math.max(...schools.map((s) => s.monthlyRevenue), 1);
  const colors = ["bg-violet-500", "bg-blue-500", "bg-indigo-500", "bg-sky-500", "bg-emerald-500"];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Revenue — {monthLabel}</p>
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full">
          {formatCurrency(total)} total
        </span>
      </div>
      {schools.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No revenue data yet</p>
      ) : (
        <div className="space-y-3">
          {schools.map((s, i) => {
            const pct = Math.round((s.monthlyRevenue / maxRev) * 100);
            return (
              <div key={s.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-zinc-400 truncate max-w-[60%]">{s.name}</span>
                  <span className="font-semibold text-gray-700 dark:text-zinc-300">{formatCurrency(s.monthlyRevenue)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                  <div className={`h-1.5 rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function SuperAdminView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0]
    || user.email?.split("@")[0]
    || "Owner";
  const institution = (user.user_metadata?.institution_name as string) ?? null;

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name, city, state, principal_name")
    .order("name");

  const schoolIds = (schoolRows ?? []).map((s: any) => s.id);

  const [
    { data: studentRows },
    { data: staffRows },
    { data: feeRows },
    { data: auditRows },
    { data: subRow },
  ] = await Promise.all([
    schoolIds.length
      ? supabaseAdmin.from("students").select("school_id, attendance_pct").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as any[] }),

    schoolIds.length
      ? supabaseAdmin.from("staff_members").select("school_id, type").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as any[] }),

    schoolIds.length
      ? supabaseAdmin.from("fee_payments").select("school_id, student_id, month_str, amount_due, amount_paid").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as any[] }),

    schoolIds.length
      ? supabaseAdmin.from("audit_log").select("school_id, action, module, description, actor_name, created_at")
          .in("school_id", schoolIds).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] as any[] }),

    schoolIds.length
      ? supabaseAdmin.from("school_subscriptions").select("plan_name, status, schools_used, max_schools, monthly_fee, renews_on")
          .eq("school_id", schoolIds[0]).maybeSingle()
      : Promise.resolve({ data: null as any }),
  ]);

  const students = (studentRows ?? []) as any[];
  const staff = (staffRows ?? []) as any[];
  const fees = (feeRows ?? []) as any[];

  // ── Per-school aggregation ──────────────────────────────────
  const byMonthPerSchool: Record<string, Record<string, { due: number; paid: number }>> = {};
  for (const f of fees) {
    (byMonthPerSchool[f.school_id] ??= {});
    (byMonthPerSchool[f.school_id][f.month_str] ??= { due: 0, paid: 0 });
    byMonthPerSchool[f.school_id][f.month_str].due += Number(f.amount_due ?? 0);
    byMonthPerSchool[f.school_id][f.month_str].paid += Number(f.amount_paid ?? 0);
  }

  const schools: SchoolSummary[] = ((schoolRows ?? []) as any[]).map((sc) => {
    const schoolStudents = students.filter((s) => s.school_id === sc.id);
    const schoolStaff = staff.filter((s) => s.school_id === sc.id);
    const avgAttendance = schoolStudents.length
      ? Math.round(schoolStudents.reduce((s, x) => s + Number(x.attendance_pct ?? 0), 0) / schoolStudents.length)
      : 0;

    const months = Object.keys(byMonthPerSchool[sc.id] ?? {}).sort();
    const latestMonth = months[months.length - 1];
    const latest = latestMonth ? byMonthPerSchool[sc.id][latestMonth] : { due: 0, paid: 0 };
    const feePct = latest.due > 0 ? Math.round((latest.paid / latest.due) * 100) : 0;

    return {
      id: sc.id,
      name: sc.name,
      location: [sc.city, sc.state].filter(Boolean).join(", "),
      students: schoolStudents.length,
      staff: schoolStaff.length,
      principal: sc.principal_name ?? "Unassigned",
      attendance: avgAttendance,
      feePct,
      monthlyRevenue: latest.paid,
    };
  });

  // ── Stats ──────────────────────────────────────────────────
  const totalStudents = students.length;
  const totalTeaching = staff.filter((s) => s.type === "teaching").length;
  const avgAttendanceAll = students.length
    ? Math.round((students.reduce((s, x) => s + Number(x.attendance_pct ?? 0), 0) / students.length) * 10) / 10
    : 0;

  const allMonths = new Set<string>();
  Object.values(byMonthPerSchool).forEach((m) => Object.keys(m).forEach((k) => allMonths.add(k)));
  const sortedMonths = Array.from(allMonths).sort();
  const latestMonthGlobal = sortedMonths[sortedMonths.length - 1];
  const monthlyRevenue = schools.reduce((s, x) => s + x.monthlyRevenue, 0);
  const monthLabel = latestMonthGlobal
    ? new Date(latestMonthGlobal + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  const byStudent: Record<string, { due: number; paid: number }> = {};
  for (const f of fees) {
    (byStudent[f.student_id] ??= { due: 0, paid: 0 });
    byStudent[f.student_id].due += Number(f.amount_due ?? 0);
    byStudent[f.student_id].paid += Number(f.amount_paid ?? 0);
  }
  const totalDue = Object.values(byStudent).reduce((s, x) => s + x.due, 0);
  const totalPaid = Object.values(byStudent).reduce((s, x) => s + x.paid, 0);
  const totalPending = Math.max(totalDue - totalPaid, 0);
  const studentsWithDues = Object.values(byStudent).filter((s) => s.due > s.paid).length;

  const stats: Stat[] = [
    { label: "Schools", value: String(schools.length), sub: schools.length ? "All operational" : "None yet", trend: "neutral", icon: Landmark, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15" },
    { label: "Total Students", value: totalStudents.toLocaleString("en-IN"), sub: "Across all schools", trend: "neutral", icon: GraduationCap, accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15" },
    { label: "Teaching Staff", value: String(totalTeaching), sub: "Across all schools", trend: "neutral", icon: Briefcase, accent: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15" },
    { label: "Avg Attendance", value: `${avgAttendanceAll}%`, sub: "All schools", trend: "up", icon: ClipboardCheck, accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15" },
    { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue), sub: monthLabel, trend: "up", icon: CreditCard, accent: "text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15" },
    { label: "Pending Dues", value: formatCurrency(totalPending), sub: `${studentsWithDues} student${studentsWithDues !== 1 ? "s" : ""}`, trend: "down", icon: AlertTriangle, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15" },
  ];

  // ── Recent activity ──────────────────────────────────────────
  const schoolNameById = new Map(((schoolRows ?? []) as any[]).map((s) => [s.id, s.name]));
  const activity: ActivityItem[] = ((auditRows ?? []) as any[]).map((a) => ({
    icon: ACTION_ICON[a.action] ?? ClipboardCheck,
    color: MODULE_COLOR[a.module] ?? "text-gray-500 bg-gray-500/10",
    title: a.description,
    sub: `${schoolNameById.get(a.school_id) ?? "—"} · ${a.module}`,
    time: formatRelativeTime(a.created_at),
  }));

  const subscription = subRow
    ? {
        planName: (subRow as any).plan_name,
        status: (subRow as any).status,
        schoolsUsed: (subRow as any).schools_used,
        maxSchools: (subRow as any).max_schools,
        monthlyFee: Number((subRow as any).monthly_fee),
        renewsOn: (subRow as any).renews_on,
      }
    : null;

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
          {schools.length} school{schools.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => <StatCard key={s.label} stat={s} />)}
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
        {schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-14 text-center">
            <Landmark className="h-7 w-7 text-gray-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No schools yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {schools.map((s) => <SchoolCard key={s.id} school={s} />)}
          </div>
        )}
      </section>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Activity */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity items={activity} />
          <RevenueBar schools={schools} monthLabel={monthLabel} />
        </div>

        {/* Right: Quick actions + Subscription */}
        <div className="space-y-5">
          <QuickActions />
          <SubscriptionCard subscription={subscription} />
        </div>

      </div>
    </div>
  );
}
