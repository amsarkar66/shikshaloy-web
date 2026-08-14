import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import FeeCollectionClient, {
  type SchoolFeeSummary,
  type Defaulter,
  type MonthTrend,
  type CategorySlice,
  type ModeSlice,
} from "./_components/FeeCollectionClient";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  online: "Online",
  cash: "Cash",
  cheque: "Cheque",
  upi: "UPI",
};

function formatMonthLabel(monthStr: string) {
  return new Date(monthStr + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default async function FeeCollectionPage() {
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

  // ── 6-month institution-wide trend ──────────────────────────────────
  const monthsPresent = Array.from(new Set(rows.map((r) => r.month_str))).sort();
  const last6Months = monthsPresent.slice(-6);
  const trendAgg: Record<string, { due: number; paid: number }> = {};
  for (const f of rows) {
    if (!last6Months.includes(f.month_str)) continue;
    const entry = trendAgg[f.month_str] ?? { due: 0, paid: 0 };
    entry.due += Number(f.amount_due ?? 0);
    entry.paid += Number(f.amount_paid ?? 0);
    trendAgg[f.month_str] = entry;
  }
  const trend: MonthTrend[] = last6Months.map((m) => ({
    month: formatMonthLabel(m),
    due: trendAgg[m].due,
    paid: trendAgg[m].paid,
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
