import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Bus, Users, MapPin, Wrench,
  ChevronRight, CalendarOff, ClipboardCheck,
  MessageSquare, Clock, AlertTriangle,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getDriverContext } from "@/lib/drivers/context";

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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface Stat { label: string; value: string; sub: string; icon: React.ElementType; accent: string }

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
          <stat.icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] text-gray-400 dark:text-zinc-500 text-right">{stat.sub}</span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{stat.value}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.label}</p>
      </div>
    </div>
  );
}

interface TripRow { routeLabel: string; regNo: string; morning: string | null; evening: string | null; studentCount: number }

function TodaysTrips({ rows }: { rows: TripRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Trips</p>
        <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No route assigned yet</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border border-gray-100 dark:border-zinc-700/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.routeLabel}</p>
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">{r.regNo}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-400">
                <span>Morning <span className="font-semibold text-gray-700 dark:text-zinc-200">{formatTime(r.morning)}</span></span>
                <span>Evening <span className="font-semibold text-gray-700 dark:text-zinc-200">{formatTime(r.evening)}</span></span>
                <span className="ml-auto flex items-center gap-1"><Users className="h-3 w-3" />{r.studentCount} students</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StopSummary { stop: string; count: number }

function RouteStops({ stops }: { stops: StopSummary[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Stops &amp; Roster</p>
        <Link href="/dashboard/routes" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View full roster <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {stops.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No stops to show</p>
      ) : (
        <div className="space-y-1">
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 text-sm text-gray-700 dark:text-zinc-300">{s.stop}</span>
              <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">{s.count} student{s.count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LeaveRow { leaveType: string; from: string; to: string; status: string }

const LEAVE_STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected:  "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-zinc-700/50 dark:text-zinc-400",
};

function RecentLeaves({ rows }: { rows: LeaveRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">My Leave Requests</p>
        <Link href="/dashboard/leaves" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No leave requests yet</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <CalendarOff className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 capitalize">{l.leaveType} leave</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(l.from)} – {formatDate(l.to)}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${LEAVE_STATUS_BADGE[l.status] ?? ""}`}>{l.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Take Trip Attendance", icon: ClipboardCheck, href: "/dashboard/attendance", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20" },
  { label: "My Routes",            icon: Bus,            href: "/dashboard/routes",     color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20" },
  { label: "Apply for Leave",      icon: CalendarOff,     href: "/dashboard/leaves",     color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20" },
  { label: "Messages",             icon: MessageSquare,   href: "/dashboard/messages",   color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
] as const;

function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${a.color}`}>
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function VehicleAlert({ nextService, regNo }: { nextService: string | null; regNo: string }) {
  if (!nextService) return null;
  const days = Math.ceil((new Date(nextService).getTime() - Date.now()) / 86400000);
  if (days > 14) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
          {days < 0 ? "Service overdue" : `Service due in ${days} day${days !== 1 ? "s" : ""}`}
        </p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{regNo} · next service {formatDate(nextService)}</p>
      </div>
    </div>
  );
}

export async function DriverView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0] || "Driver";
  const driver = await getDriverContext(user.id);

  if (!driver) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🚌</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have a staff record yet. Ask your school admin to link your login.
          </p>
        </div>
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);

  const { data: leaveRows } = await supabaseAdmin
    .from("leave_requests")
    .select("leave_type, from_date, to_date, status")
    .eq("staff_id", driver.staffId)
    .order("applied_on", { ascending: false })
    .limit(3);

  const { data: pendingLeaveRows } = await supabaseAdmin
    .from("leave_requests")
    .select("id")
    .eq("staff_id", driver.staffId)
    .eq("status", "pending");

  const totalStudents = driver.routes.reduce((sum, r) => sum + r.roster.length, 0);
  const primaryVehicle = driver.routes.find((r) => r.vehicle)?.vehicle ?? null;

  const stopCounts: Record<string, number> = {};
  for (const r of driver.routes) {
    for (const s of r.roster) {
      stopCounts[s.stopName] = (stopCounts[s.stopName] ?? 0) + 1;
    }
  }
  const stopSummary: StopSummary[] = Object.entries(stopCounts).map(([stop, count]) => ({ stop, count }));

  const trips: TripRow[] = driver.routes.map((r) => ({
    routeLabel: `${r.routeNo} · ${r.routeName}`,
    regNo: r.vehicle?.regNo ?? "No vehicle",
    morning: r.morningDeparture,
    evening: r.eveningDeparture,
    studentCount: r.roster.length,
  }));

  const leaves: LeaveRow[] = (leaveRows ?? []).map((l) => ({
    leaveType: l.leave_type,
    from: l.from_date ?? todayISO,
    to: l.to_date ?? todayISO,
    status: l.status ?? "pending",
  }));

  const stats: Stat[] = [
    { label: "Assigned Routes", value: String(driver.routes.length), sub: driver.routes.length ? driver.routes.map((r) => r.routeNo).join(", ") : "none", icon: Bus, accent: "text-teal-500 bg-teal-500/10 dark:bg-teal-500/15" },
    { label: "Students on Route", value: String(totalStudents), sub: `${stopSummary.length} stops`, icon: Users, accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15" },
    { label: "Vehicle", value: primaryVehicle?.regNo ?? "—", sub: primaryVehicle?.model ?? "unassigned", icon: Wrench, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15" },
    { label: "Pending Leaves", value: String(pendingLeaveRows?.length ?? 0), sub: "awaiting approval", icon: CalendarOff, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{getGreeting()}, {name} 👋</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{driver.designation} · {formatHeaderDate()}</p>
        </div>
      </div>

      {primaryVehicle && <VehicleAlert nextService={primaryVehicle.nextService} regNo={primaryVehicle.regNo} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaysTrips rows={trips} />
          <RouteStops stops={stopSummary} />
        </div>
        <div className="space-y-5">
          <QuickActions />
          <RecentLeaves rows={leaves} />
        </div>
      </div>
    </div>
  );
}
