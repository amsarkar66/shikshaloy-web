import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import FeesClient from "./_components/FeesClient";
import type { FeeStudent, FeePaymentRow } from "./_data/fees";

export default async function FeesPage() {
  const [{ data: studentRows }, { data: paymentRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, phone, status,
        sections ( name, grades ( level ) ),
        student_parents ( parents ( full_name ) )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("full_name"),

    supabaseAdmin
      .from("fee_payments")
      .select("id, student_id, month_str, category, amount_due, amount_paid, status, paid_date, receipt_no, payment_mode")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("month_str"),
  ]);

  const students: FeeStudent[] = (studentRows ?? []).map((s: any) => ({
    id: s.id,
    name: s.full_name ?? "",
    rollNo: s.roll_no ?? "",
    classNum: String(s.sections?.grades?.level ?? ""),
    section: s.sections?.name ?? "",
    parent: s.student_parents?.[0]?.parents?.full_name ?? "—",
    phone: s.phone ?? "—",
    active: s.status === "active",
  }));

  const payments: FeePaymentRow[] = (paymentRows ?? []).map((p: any) => ({
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
