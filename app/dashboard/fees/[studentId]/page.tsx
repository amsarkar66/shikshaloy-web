import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import StudentFeeDetailClient from "../_components/StudentFeeDetailClient";
import type { FeeStudent, FeePaymentRow } from "../_data/fees";

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

export default async function StudentFeeDetailPage({
  params, searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { studentId } = await params;
  const { month } = await searchParams;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: studentRow }, { data: paymentRows }, { data: allMonthRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, phone, status,
        sections ( name, grades ( level ) ),
        student_parents ( parents ( full_name ) )
      `)
      .eq("id", studentId)
      .eq("school_id", schoolId)
      .maybeSingle(),

    supabaseAdmin
      .from("fee_payments")
      .select("id, student_id, month_str, category, amount_due, amount_paid, status, paid_date, receipt_no, payment_mode")
      .eq("school_id", schoolId)
      .eq("student_id", studentId)
      .order("month_str"),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str")
      .eq("school_id", schoolId),
  ]);

  if (!studentRow) notFound();

  const s = studentRow as unknown as FeeStudentRow;
  const student: FeeStudent = {
    id: s.id,
    name: s.full_name ?? "",
    rollNo: s.roll_no ?? "",
    classNum: String(s.sections?.grades?.level ?? ""),
    section: s.sections?.name ?? "",
    parent: s.student_parents?.[0]?.parents?.full_name ?? "—",
    phone: s.phone ?? "—",
    active: s.status === "active",
  };

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

  const months = Array.from(new Set((allMonthRows ?? []).map((r) => r.month_str))).sort();
  if (months.length === 0) notFound();

  const paymentsByMonth = new Map<string, FeePaymentRow[]>();
  for (const p of payments) {
    const arr = paymentsByMonth.get(p.monthStr) ?? [];
    arr.push(p);
    paymentsByMonth.set(p.monthStr, arr);
  }

  const initialMonthStr = month && months.includes(month) ? month : months[months.length - 1];

  return (
    <StudentFeeDetailClient
      student={student}
      months={months}
      initialMonthStr={initialMonthStr}
      paymentsByMonth={paymentsByMonth}
      backHref="/dashboard/fees"
    />
  );
}
