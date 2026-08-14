"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

async function requireFeeManagerRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!role || !["admin", "super_admin", "staff"].includes(role)) {
    throw new Error("Unauthorized");
  }
}

export async function recordFeePayment(
  studentId: string,
  monthStr: string,
  amount: number,
  paidDate: string,
  paymentMode: "online" | "cash" | "cheque" | "upi"
) {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: rows } = await supabaseAdmin
    .from("fee_payments")
    .select("id, amount_due, amount_paid, receipt_no")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("month_str", monthStr)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) throw new Error("No fee record found for this student and month");

  const receiptNo =
    rows.find((r) => r.receipt_no)?.receipt_no ??
    `RCP-${monthStr.replace("-", "")}-${Math.floor(Math.random() * 9000) + 1000}`;

  // Allocate the payment across this month's fee categories in creation order,
  // filling each category's balance before moving to the next.
  let remaining = amount;
  for (const row of rows) {
    if (remaining <= 0) break;
    const due = Number(row.amount_due);
    const paidSoFar = Number(row.amount_paid);
    const balance = due - paidSoFar;
    if (balance <= 0) continue;

    const applied = Math.min(balance, remaining);
    const newPaid = paidSoFar + applied;
    const status = newPaid >= due ? "paid" : newPaid > 0 ? "partial" : "overdue";

    const { error } = await supabaseAdmin
      .from("fee_payments")
      .update({
        amount_paid: newPaid,
        status,
        paid_date: paidDate,
        payment_mode: paymentMode,
        receipt_no: receiptNo,
      })
      .eq("id", row.id);

    if (error) throw new Error(error.message);
    remaining -= applied;
  }

  revalidatePath("/dashboard/fees");
}

// ── Fee structure (what's charged per grade per category) ────────────────────

export interface FeeStructureInput {
  category: string;
  amount: number;
  gradeId: string | null; // null = applies to all grades
  frequency: "monthly" | "quarterly" | "annual";
  isOptional: boolean;
}

export async function createFeeStructure(input: FeeStructureInput): Promise<{ id: string }> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("fee_structures")
    .insert({
      school_id: schoolId,
      academic_year_id: await getCurrentAcademicYearId(),
      grade_id: input.gradeId,
      category: input.category,
      amount: input.amount,
      frequency: input.frequency,
      is_optional: input.isOptional,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to create fee structure: ${error?.message}`);

  revalidatePath("/dashboard/fees");
  return { id: data.id };
}

export async function updateFeeStructure(id: string, input: FeeStructureInput): Promise<void> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("fee_structures")
    .update({
      grade_id: input.gradeId,
      category: input.category,
      amount: input.amount,
      frequency: input.frequency,
      is_optional: input.isOptional,
    })
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update fee structure: ${error.message}`);

  revalidatePath("/dashboard/fees");
}

export async function deleteFeeStructure(id: string): Promise<void> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("fee_structures")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to delete fee structure: ${error.message}`);

  revalidatePath("/dashboard/fees");
}

// ── Monthly fee generation ────────────────────────────────────────────────────

interface StudentGradeRow {
  id: string;
  sections: { grade_id: string | null } | null;
}

export async function generateMonthlyFees(monthStr: string): Promise<{ created: number }> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const academicYearId = await getCurrentAcademicYearId();

  const { data: structures } = await supabaseAdmin
    .from("fee_structures")
    .select("grade_id, category, amount")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  if (!structures || structures.length === 0) {
    throw new Error("No fee structure configured yet — add fee categories first.");
  }

  const [{ data: students }, { data: existing }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, sections ( grade_id )")
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabaseAdmin
      .from("fee_payments")
      .select("student_id, category")
      .eq("school_id", schoolId)
      .eq("month_str", monthStr),
  ]);

  const existingPairs = new Set((existing ?? []).map((r) => `${r.student_id}|${r.category}`));

  const rowsToInsert: {
    school_id: string;
    student_id: string;
    academic_year_id: string;
    month_str: string;
    category: string;
    amount_due: number;
    amount_paid: number;
    status: "overdue";
  }[] = [];

  for (const s of (students ?? []) as unknown as StudentGradeRow[]) {
    const gradeId = s.sections?.grade_id ?? null;
    for (const structure of structures) {
      const applies = structure.grade_id === null || structure.grade_id === gradeId;
      if (!applies) continue;
      const key = `${s.id}|${structure.category}`;
      if (existingPairs.has(key)) continue;
      rowsToInsert.push({
        school_id: schoolId,
        student_id: s.id,
        academic_year_id: academicYearId,
        month_str: monthStr,
        category: structure.category,
        amount_due: structure.amount,
        amount_paid: 0,
        status: "overdue",
      });
    }
  }

  if (rowsToInsert.length > 0) {
    const { error } = await supabaseAdmin.from("fee_payments").insert(rowsToInsert);
    if (error) throw new Error(`Failed to generate fees: ${error.message}`);
  }

  revalidatePath("/dashboard/fees");
  return { created: rowsToInsert.length };
}
