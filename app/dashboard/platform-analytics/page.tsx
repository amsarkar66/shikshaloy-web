import { redirect } from "next/navigation";
import { TrendingUp, CheckCircle2, Building2, PieChart } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";

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

const PLAN_COLORS = ["bg-sky-500", "bg-blue-500", "bg-violet-500", "bg-primary-500", "bg-teal-500"];
const TYPE_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-teal-500", "bg-fuchsia-500"];

export default async function PlatformAnalyticsPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const [{ data: schools }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("schools").select("id, status, institution_type, created_at"),
    supabaseAdmin.from("school_subscriptions").select("plan_name, status"),
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

  return (
    <div className="w-full space-y-6 px-6 py-8">
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
    </div>
  );
}
