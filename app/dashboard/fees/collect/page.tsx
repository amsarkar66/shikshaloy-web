import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import FeeCollectClient from "../_components/FeeCollectClient";
import type { FeeStudent, FeePaymentRow } from "../_data/fees";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to fee management.</p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

interface FeeStudentRow {
  id: string;
  full_name: string | null;
  roll_no: string | null;
  phone: string | null;
  status: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: { parents: { full_name: string | null } | null }[] | null;
}

export default async function FeeCollectPage() {
  try {
    await requireRoleOrStaffTemplate(["admin"], ["accountant"]);
  } catch {
    return <Unauthorized />;
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

  return <FeeCollectClient students={students} payments={payments} backHref="/dashboard/fees" />;
}
