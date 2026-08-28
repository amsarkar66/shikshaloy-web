import { supabaseAdmin } from "@/lib/supabase/service";

// students.fee_status is a denormalized rollup for the Students list badge —
// nothing kept it in sync with fee_payments, so it sat frozen at "overdue"
// (its insert-time default) forever, even for a fully paid student. Worst
// case wins: any overdue row means overdue, else any partial means partial,
// else paid. A student with no fee_payments rows at all (nothing billed yet)
// is left untouched rather than flipped to "paid".
export async function recomputeStudentFeeStatus(studentId: string): Promise<void> {
  const { data: rows } = await supabaseAdmin
    .from("fee_payments")
    .select("status")
    .eq("student_id", studentId);

  if (!rows || rows.length === 0) return;

  const status = rows.some((r) => r.status === "overdue")
    ? "overdue"
    : rows.some((r) => r.status === "partial")
      ? "partial"
      : "paid";

  await supabaseAdmin.from("students").update({ fee_status: status }).eq("id", studentId);
}
