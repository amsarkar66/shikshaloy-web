import { redirect } from "next/navigation";
import { Gauge, AlertTriangle, Users, Building2 } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmptyRow } from "@/components/ui/data-table";

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

export default async function UsagePage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const [{ data: institutions }, { data: schools }, { data: subs }, { data: studentRows }] = await Promise.all([
    supabaseAdmin.from("institutions").select("id, name, status").eq("status", "active"),
    supabaseAdmin.from("schools").select("id, institution_id"),
    supabaseAdmin.from("school_subscriptions").select("institution_id, plan_name, schools_used, max_schools"),
    supabaseAdmin.from("students").select("school_id"),
  ]);

  const schoolToInstitution = new Map((schools ?? []).map((s) => [s.id, s.institution_id]));
  const subsByInstitution = new Map((subs ?? []).map((s) => [s.institution_id, s]));
  const studentCounts = new Map<string, number>();
  for (const row of studentRows ?? []) {
    const institutionId = schoolToInstitution.get(row.school_id);
    if (!institutionId) continue;
    studentCounts.set(institutionId, (studentCounts.get(institutionId) ?? 0) + 1);
  }

  const rows = (institutions ?? []).map((inst) => {
    const sub = subsByInstitution.get(inst.id);
    const used = sub?.schools_used ?? 1;
    const max = sub?.max_schools ?? 1;
    const pct = max > 0 ? Math.round((used / max) * 100) : 0;
    return {
      id: inst.id,
      name: inst.name,
      planName: sub?.plan_name ?? "—",
      used,
      max,
      pct,
      students: studentCounts.get(inst.id) ?? 0,
    };
  }).sort((a, b) => b.pct - a.pct);

  const nearCapacity = rows.filter((r) => r.pct >= 80).length;
  const totalStudents = rows.reduce((sum, r) => sum + r.students, 0);

  const stats = [
    { label: "Active institutions",  value: String(rows.length),   icon: Building2,     color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Near plan capacity",   value: String(nearCapacity),  icon: AlertTriangle, color: "bg-amber-500/15 text-amber-500" },
    { label: "Total students",       value: totalStudents.toLocaleString("en-IN"), icon: Users, color: "bg-emerald-500/15 text-emerald-500" },
  ];

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Table>
        <TableHead>
          <Th position="first">Institution</Th>
          <Th>Plan</Th>
          <Th>School capacity</Th>
          <Th position="last">Students</Th>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow colSpan={4} icon={Gauge} message="No active institutions yet." />
          ) : (
            rows.map((r) => (
              <Tr key={r.id}>
                <Td position="first" className="text-sm font-medium text-gray-900 dark:text-zinc-50">{r.name}</Td>
                <Td className="text-sm text-primary-600 dark:text-zinc-400">{r.planName}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${r.pct >= 100 ? "bg-red-500" : r.pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(100, r.pct)}%` }}
                      />
                    </div>
                    <span className="text-xs text-primary-500 dark:text-zinc-500 whitespace-nowrap">{r.used} / {r.max} schools</span>
                  </div>
                </Td>
                <Td position="last" className="text-sm text-gray-700 dark:text-zinc-300">{r.students.toLocaleString("en-IN")}</Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
