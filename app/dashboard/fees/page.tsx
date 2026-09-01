import { IndianRupee, CheckCircle2, AlertCircle } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getParentContext } from "@/lib/parents/context";
import FeesClient from "./_components/FeesClient";
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

export default async function FeesPage() {
  const vu = await getVerifiedUser();

  if (vu?.role === "parent") {
    return <ParentFees userId={vu.id} />;
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
