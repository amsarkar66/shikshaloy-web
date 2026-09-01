import { redirect } from "next/navigation";
import { TrendingUp, CheckCircle2, Building2, PieChart, Globe, Users2, Eye, Clock, LineChart } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getWebsiteAnalytics } from "@/lib/google-analytics/report";

export const dynamic = "force-dynamic";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{value}</p>
        <p className="text-sm text-primary-600 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function BarList({ items, total }: { items: { label: string; count: number; color: string }[]; total: number }) {
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
        return (
          <div key={it.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-zinc-300">{it.label}</span>
              <span className="text-primary-500 dark:text-zinc-500">{it.count} · {pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
              <div className={`h-full rounded-full ${it.color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-primary-500 dark:text-zinc-500">No data yet.</p>
      )}
    </div>
  );
}

function MonthlyTrend({ months }: { months: { label: string; count: number }[] }) {
  const max = Math.max(1, ...months.map((m) => m.count));
  return (
    <div className="flex h-40 items-end gap-3">
      {months.map((m) => (
        <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{m.count}</span>
          <div className="flex w-full items-end justify-center" style={{ height: "100px" }}>
            <div
              className="w-full max-w-8 rounded-t-md bg-primary-500/70 dark:bg-primary-500/60"
              style={{ height: `${(m.count / max) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
            />
          </div>
          <span className="text-[11px] text-primary-500 dark:text-zinc-500">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function DailyTrend({ days }: { days: { date: string; users: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.users));
  const tickEvery = Math.max(1, Math.ceil(days.length / 6));

  function fmtDate(d: string) {
    // GA4's `date` dimension comes back as "YYYYMMDD".
    if (d.length !== 8) return d;
    return new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  return (
    <div className="flex h-32 items-end gap-[3px]">
      {days.map((d, i) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
          <div
            className="w-full rounded-t-sm bg-primary-500/70 dark:bg-primary-500/60 transition-colors group-hover:bg-primary-500"
            style={{ height: `${(d.users / max) * 100}%`, minHeight: d.users > 0 ? "2px" : "0" }}
          />
          <span className="text-[10px] text-primary-500 dark:text-zinc-500 whitespace-nowrap">
            {i % tickEvery === 0 ? fmtDate(d.date) : ""}
          </span>
          <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-gray-900 dark:bg-zinc-700 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
            {fmtDate(d.date)} · {d.users} user{d.users === 1 ? "" : "s"}
          </div>
        </div>
      ))}
      {days.length === 0 && (
        <p className="w-full py-10 text-center text-sm text-primary-500 dark:text-zinc-500">No data yet.</p>
      )}
    </div>
  );
}

function AnalyticsNotConnected() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 p-8 text-center">
      <Globe className="mx-auto h-8 w-8 text-gray-300 dark:text-zinc-600" />
      <h2 className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Website traffic isn&apos;t connected</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-primary-500 dark:text-zinc-500">
        Add a GA4 service account with Viewer access on the property tracked by <code className="text-xs">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> — set{" "}
        <code className="text-xs">GA4_PROPERTY_ID</code>, <code className="text-xs">GA4_SERVICE_ACCOUNT_EMAIL</code>, and{" "}
        <code className="text-xs">GA4_SERVICE_ACCOUNT_PRIVATE_KEY</code> to show real visitor data here.
      </p>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const PLAN_COLORS = ["bg-sky-500", "bg-blue-500", "bg-violet-500", "bg-primary-500", "bg-teal-500"];
const TYPE_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-fuchsia-500"];
const SOURCE_COLORS = ["bg-primary-500", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];

export default async function PlatformAnalyticsPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");

  if (verifiedUser.role !== "kernel") redirect("/dashboard");

  const [{ data: schools }, { data: subs }, websiteAnalytics] = await Promise.all([
    supabaseAdmin.from("schools").select("id, status, institution_type, created_at"),
    supabaseAdmin.from("school_subscriptions").select("plan_name, status"),
    getWebsiteAnalytics(30),
  ]);

  const allSchools = schools ?? [];
  const active = allSchools.filter((s) => s.status === "active").length;
  const rejected = allSchools.filter((s) => s.status === "rejected").length;
  const pending = allSchools.filter((s) => s.status === "pending").length;
  const decided = active + rejected;
  const approvalRate = decided > 0 ? Math.round((active / decided) * 100) : 0;

  // Signups by month, last 6 months.
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-IN", { month: "short" }), count: 0 };
  });
  for (const s of allSchools) {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.count += 1;
  }

  const planCounts = new Map<string, number>();
  for (const s of subs ?? []) {
    if (s.status !== "active") continue;
    planCounts.set(s.plan_name, (planCounts.get(s.plan_name) ?? 0) + 1);
  }
  const activeSubsCount = [...planCounts.values()].reduce((a, b) => a + b, 0);
  const planItems = [...planCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({ label, count, color: PLAN_COLORS[i % PLAN_COLORS.length] }));

  const typeCounts = new Map<string, number>();
  for (const s of allSchools) {
    const label = s.institution_type ?? "Unspecified";
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  }
  const typeItems = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({ label, count, color: TYPE_COLORS[i % TYPE_COLORS.length] }));

  const stats = [
    { label: "Institutions (6 mo)", value: String(months.reduce((a, m) => a + m.count, 0)), icon: TrendingUp, color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Approval rate",       value: `${approvalRate}%`,                              icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-500" },
    { label: "Awaiting review",     value: String(pending),                                 icon: Building2,   color: "bg-amber-500/15 text-amber-500" },
    { label: "Active subscriptions",value: String(activeSubsCount),                         icon: PieChart,    color: "bg-violet-500/15 text-violet-500" },
  ];

  const websiteStats = websiteAnalytics && [
    { label: "Visitors (30d)",      value: String(websiteAnalytics.activeUsers),                     icon: Users2, color: "bg-primary-500/15 text-primary-500" },
    { label: "Sessions",            value: String(websiteAnalytics.sessions),                        icon: LineChart, color: "bg-sky-500/15 text-sky-500" },
    { label: "Page views",          value: String(websiteAnalytics.pageViews),                       icon: Eye, color: "bg-violet-500/15 text-violet-500" },
    { label: "Avg. session",        value: formatDuration(websiteAnalytics.avgSessionDurationSec),   icon: Clock, color: "bg-amber-500/15 text-amber-500" },
  ];

  const trafficSourceItems = (websiteAnalytics?.trafficSources ?? [])
    .map((s, i) => ({ label: s.source, count: s.sessions, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }));
  const trafficSourceTotal = trafficSourceItems.reduce((a, it) => a + it.count, 0);

  const topPageItems = (websiteAnalytics?.topPages ?? [])
    .map((p, i) => ({ label: p.path, count: p.views, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }));
  const topPageTotal = topPageItems.reduce((a, it) => a + it.count, 0);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Platform Analytics</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Signups, plan mix, and approval trends</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Institution signups — last 6 months</h2>
        <MonthlyTrend months={months} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Plan mix (active subscriptions)</h2>
          <BarList items={planItems} total={activeSubsCount} />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Institution types</h2>
          <BarList items={typeItems} total={allSchools.length} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Globe className="h-4 w-4 text-primary-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Website traffic — last 30 days</h2>
      </div>

      {websiteAnalytics && websiteStats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {websiteStats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Daily visitors</h2>
            <DailyTrend days={websiteAnalytics.dailyUsers} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Traffic sources</h2>
              <BarList items={trafficSourceItems} total={trafficSourceTotal} />
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Top pages</h2>
              <BarList items={topPageItems} total={topPageTotal} />
            </div>
          </div>
        </>
      ) : (
        <AnalyticsNotConnected />
      )}
    </div>
  );
}
