import { IndianRupee, CheckCircle2, AlertCircle } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getParentContext } from "@/lib/parents/context";
import FeesClient from "./_components/FeesClient";
import FeeCollectionClient, {
  type SchoolFeeSummary,
  type Defaulter,
  type MonthTrend,
  type CategorySlice,
  type ModeSlice,
} from "./_components/FeeCollectionClient";
import type { FeeStudent, FeePaymentRow } from "./_data/fees";
import { STATUS_BADGE, formatCurrency, formatMonth, formatDate } from "./_data/fees";

interface FeeStudentRow {
  id: string;
  full_name: string | null;
  roll_no: string | null;
  phone: string | null;
  status: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: { parents: { full_name: string | null } | null }[] | null;
}

interface ParentFeePaymentRow {
  student_id: string;
  month_str: string;
  category: string;
  amount_due: number | null;
  amount_paid: number | null;
  status: string | null;
  paid_date: string | null;
  receipt_no: string | null;
}

const PAYMENT_MODE_LABEL: Record<string, string> = {
  online: "Online",
  cash: "Cash",
  cheque: "Cheque",
  upi: "UPI",
};

function formatMonthLabel(monthStr: string) {
  return new Date(monthStr + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatMonthShortLabel(monthStr: string) {
  return new Date(monthStr + "-01").toLocaleDateString("en-IN", { month: "short" });
}

function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function ParentFees({ userId }: { userId: string }) {
  const parent = await getParentContext(userId);

  if (!parent || parent.children.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No children linked to this account</p>
        </div>
      </div>
    );
  }

  const childIds = parent.children.map((c) => c.id);
  const { data: paymentRows } = await supabaseAdmin
    .from("fee_payments")
    .select("student_id, month_str, category, amount_due, amount_paid, status, paid_date, receipt_no")
    .in("student_id", childIds)
    .order("month_str", { ascending: false });

  const paymentsByChild = new Map<string, ParentFeePaymentRow[]>();
  for (const p of (paymentRows ?? []) as ParentFeePaymentRow[]) {
    (paymentsByChild.get(p.student_id) ?? paymentsByChild.set(p.student_id, []).get(p.student_id)!).push(p);
  }

  let totalDue = 0, totalPaid = 0;
  for (const p of (paymentRows ?? []) as ParentFeePaymentRow[]) {
    totalDue += Number(p.amount_due ?? 0);
    totalPaid += Number(p.amount_paid ?? 0);
  }
  const outstanding = Math.max(totalDue - totalPaid, 0);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Fees</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Fee dues and payment history for your children</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: formatCurrency(totalDue), icon: IndianRupee, accent: "text-indigo-500 bg-indigo-500/10" },
          { label: "Total Paid", value: formatCurrency(totalPaid), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
          { label: "Outstanding", value: formatCurrency(outstanding), icon: AlertCircle, accent: outstanding > 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {parent.children.map((child) => {
        const payments = paymentsByChild.get(child.id) ?? [];
        const childDue = payments.reduce((s, p) => s + Number(p.amount_due ?? 0), 0);
        const childPaid = payments.reduce((s, p) => s + Number(p.amount_paid ?? 0), 0);
        return (
          <div key={child.id} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{child.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  {child.gradeLevel ? `Class ${child.gradeLevel}-${child.sectionName}` : "—"} · Roll {child.rollNo || "—"}
                </p>
              </div>
              {childDue > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Paid</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(childPaid)} <span className="text-gray-400 dark:text-zinc-500 font-normal">of {formatCurrency(childDue)}</span>
                  </p>
                </div>
              )}
            </div>
            {payments.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No fee records yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{p.category} — {formatMonth(p.month_str)}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {p.paid_date ? `Paid ${formatDate(p.paid_date)}` : "Not yet paid"}{p.receipt_no ? ` · ${p.receipt_no}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{formatCurrency(Number(p.amount_due ?? 0))}</p>
                      <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[(p.status ?? "overdue") as keyof typeof STATUS_BADGE]}`}>
                        {p.status ?? "overdue"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

async function SuperAdminFeeCollection() {
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name")
    .eq("institution_id", institutionId)
    .order("name");

  const schools = (schoolRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
  const schoolIds = schools.map((s) => s.id);
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

  type FeeRow = {
    school_id: string;
    student_id: string;
    month_str: string;
    amount_due: number | null;
    amount_paid: number | null;
    category: string | null;
    payment_mode: string | null;
  };

  const [{ data: feeRows }, { data: studentRows }] = await Promise.all([
    schoolIds.length
      ? supabaseAdmin
          .from("fee_payments")
          .select("school_id, student_id, month_str, amount_due, amount_paid, category, payment_mode")
          .in("school_id", schoolIds)
      : Promise.resolve({ data: [] as FeeRow[] }),
    schoolIds.length
      ? supabaseAdmin.from("students").select("id, full_name, school_id").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; school_id: string }[] }),
  ]);

  const rows: FeeRow[] = feeRows ?? [];
  const studentNameById = new Map((studentRows ?? []).map((s) => [s.id, s.full_name ?? "—"]));

  // ── Institution-wide "current month" = latest month present anywhere ──
  const currentMonth = rows.reduce((max, r) => (r.month_str > max ? r.month_str : max), "");

  // ── Per-school collection % for the current month ──────────────────
  const feeAggBySchool: Record<string, { due: number; paid: number }> = {};
  for (const f of rows) {
    if (f.month_str !== currentMonth) continue;
    const entry = feeAggBySchool[f.school_id] ?? { due: 0, paid: 0 };
    entry.due += Number(f.amount_due ?? 0);
    entry.paid += Number(f.amount_paid ?? 0);
    feeAggBySchool[f.school_id] = entry;
  }

  const schoolSummaries: SchoolFeeSummary[] = schools.map((s) => {
    const agg = feeAggBySchool[s.id];
    return {
      id: s.id,
      name: s.name,
      due: agg?.due ?? 0,
      paid: agg?.paid ?? 0,
      pending: agg ? Math.max(agg.due - agg.paid, 0) : 0,
      collectionPct: agg && agg.due > 0 ? Math.round((agg.paid / agg.due) * 100) : 0,
      hasData: !!agg,
      monthLabel: currentMonth ? formatMonthLabel(currentMonth) : "—",
    };
  });

  // ── 12-month institution-wide trend ──────────────────────────────────
  // A fixed calendar range (rather than just whichever months happen to have
  // rows) so the chart always shows a full year, with $0 bars for months
  // that had no fee activity instead of compressing/skipping them.
  const trendAnchorMonth = currentMonth || new Date().toISOString().slice(0, 7);
  const last12Months = Array.from({ length: 12 }, (_, i) => shiftMonth(trendAnchorMonth, i - 11));
  const trendAgg: Record<string, { due: number; paid: number }> = {};
  for (const f of rows) {
    if (!last12Months.includes(f.month_str)) continue;
    const entry = trendAgg[f.month_str] ?? { due: 0, paid: 0 };
    entry.due += Number(f.amount_due ?? 0);
    entry.paid += Number(f.amount_paid ?? 0);
    trendAgg[f.month_str] = entry;
  }
  const trend: MonthTrend[] = last12Months.map((m) => ({
    month: formatMonthShortLabel(m),
    due: trendAgg[m]?.due ?? 0,
    paid: trendAgg[m]?.paid ?? 0,
  }));

  // ── Fee-head (category) breakdown for the current month ─────────────
  const categoryAgg: Record<string, number> = {};
  for (const f of rows) {
    if (f.month_str !== currentMonth) continue;
    const cat = f.category ?? "Other";
    categoryAgg[cat] = (categoryAgg[cat] ?? 0) + Number(f.amount_due ?? 0);
  }
  const categoryTotal = Object.values(categoryAgg).reduce((a, b) => a + b, 0);
  const CATEGORY_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6"];
  const categoryBreakdown: CategorySlice[] = Object.entries(categoryAgg)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount], i) => ({
      category,
      amount,
      pct: categoryTotal > 0 ? Math.round((amount / categoryTotal) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  // ── Payment-mode breakdown (collected amount) for the current month ─
  const modeAgg: Record<string, number> = {};
  for (const f of rows) {
    if (f.month_str !== currentMonth) continue;
    if (!f.payment_mode || !f.amount_paid) continue;
    modeAgg[f.payment_mode] = (modeAgg[f.payment_mode] ?? 0) + Number(f.amount_paid ?? 0);
  }
  const modeTotal = Object.values(modeAgg).reduce((a, b) => a + b, 0);
  const modeBreakdown: ModeSlice[] = Object.entries(modeAgg)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, amount]) => ({
      mode: PAYMENT_MODE_LABEL[mode] ?? mode,
      amount,
      pct: modeTotal > 0 ? Math.round((amount / modeTotal) * 100) : 0,
    }));

  // ── Cross-school defaulters (lifetime due vs paid, worst first) ──
  const byStudent: Record<string, { due: number; paid: number; schoolId: string }> = {};
  for (const f of rows) {
    const entry = byStudent[f.student_id] ?? { due: 0, paid: 0, schoolId: f.school_id };
    entry.due += Number(f.amount_due ?? 0);
    entry.paid += Number(f.amount_paid ?? 0);
    byStudent[f.student_id] = entry;
  }

  const defaulters: Defaulter[] = Object.entries(byStudent)
    .filter(([, v]) => v.due > v.paid)
    .map(([studentId, v]) => ({
      studentId,
      studentName: studentNameById.get(studentId) ?? "—",
      schoolId: v.schoolId,
      schoolName: schoolNameById.get(v.schoolId) ?? "—",
      due: v.due,
      paid: v.paid,
      pending: v.due - v.paid,
    }))
    .sort((a, b) => b.pending - a.pending);

  return (
    <FeeCollectionClient
      schools={schoolSummaries}
      defaulters={defaulters}
      trend={trend}
      categoryBreakdown={categoryBreakdown}
      modeBreakdown={modeBreakdown}
      currentMonthLabel={currentMonth ? formatMonthLabel(currentMonth) : "—"}
    />
  );
}

export default async function FeesPage() {
  const vu = await getVerifiedUser();

  if (vu?.role === "parent") {
    return <ParentFees userId={vu.id} />;
  }

  if (vu?.role === "super_admin") {
    return <SuperAdminFeeCollection />;
  }

  try {
    await requireRoleOrStaffTemplate(["admin"], ["accountant"]);
  } catch {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to fee management.</p>
        </div>
      </div>
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: studentRows }, { data: paymentRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, phone, status,
        sections ( name, grades ( level ) ),
        student_parents ( parents ( full_name ) )
      `)
      .eq("school_id", schoolId)
      .order("full_name"),

    supabaseAdmin
      .from("fee_payments")
      .select("id, student_id, month_str, category, amount_due, amount_paid, status, paid_date, receipt_no, payment_mode")
      .eq("school_id", schoolId)
      .order("month_str"),
  ]);

  const students: FeeStudent[] = ((studentRows ?? []) as unknown as FeeStudentRow[]).map((s) => ({
    id: s.id,
    name: s.full_name ?? "",
    rollNo: s.roll_no ?? "",
    classNum: String(s.sections?.grades?.level ?? ""),
    section: s.sections?.name ?? "",
    parent: s.student_parents?.[0]?.parents?.full_name ?? "—",
    phone: s.phone ?? "—",
    active: s.status === "active",
  }));

  const payments: FeePaymentRow[] = (paymentRows ?? []).map((p) => ({
    id: p.id,
    studentId: p.student_id,
    monthStr: p.month_str,
    category: p.category,
    amountDue: Number(p.amount_due ?? 0),
    amountPaid: Number(p.amount_paid ?? 0),
    status: p.status ?? "overdue",
    paidDate: p.paid_date,
    receiptNo: p.receipt_no,
    paymentMode: p.payment_mode,
  }));

  return <FeesClient students={students} payments={payments} />;
}
