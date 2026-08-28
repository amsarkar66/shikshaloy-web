"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { logAuditEvent } from "@/lib/audit/log";
import { notifyRoles } from "@/lib/notifications/create";
import { getUser } from "@/lib/supabase/server";
import { pickGradeApplicable } from "@/lib/fees/resolve";
import { recomputeStudentFeeStatus } from "@/lib/fees/recompute-status";

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

  await recomputeStudentFeeStatus(studentId);

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Fees",
    description: `Recorded ₹${amount.toLocaleString("en-IN")} payment for ${student?.full_name ?? "a student"} (${monthStr})`,
  });

  const { data: { user } } = await getUser();
  await notifyRoles({
    schoolId,
    roles: ["admin", "super_admin"],
    excludeProfileId: user?.id,
    title: "Fee payment received",
    description: `₹${amount.toLocaleString("en-IN")} received from ${student?.full_name ?? "a student"} (${monthStr})`,
    link: `/dashboard/fees/${studentId}`,
  });

  revalidatePath("/dashboard/fees");
  revalidatePath(`/dashboard/fees/${studentId}`);
  revalidatePath("/dashboard/fees/collect");
}

// ── Fee structure (what's charged per grade per category) ────────────────────

export interface FeeStructureInput {
  category: string;
  amount: number;
  gradeId: string | null; // null = applies to all grades
  frequency: "monthly" | "quarterly" | "annual";
  isOptional: boolean;
  isOneTime: boolean;
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
      is_one_time: input.isOneTime,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to create fee structure: ${error?.message}`);

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Fees",
    description: `Added fee category '${input.category}' (₹${input.amount.toLocaleString("en-IN")}/${input.frequency})`,
  });

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard/fees/structure");
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
      is_one_time: input.isOneTime,
    })
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update fee structure: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Fees",
    description: `Updated fee category '${input.category}' (₹${input.amount.toLocaleString("en-IN")}/${input.frequency})`,
  });

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard/fees/structure");
}

export async function deleteFeeStructure(id: string): Promise<void> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: structure, error } = await supabaseAdmin
    .from("fee_structures")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("category")
    .single();

  if (error) throw new Error(`Failed to delete fee structure: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "delete",
    module: "Fees",
    description: `Removed fee category '${structure.category}'`,
  });

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard/fees/structure");
}

export interface FeeStructureLookup {
  oneTime: { category: string; amount: number }[];
  recurring: { category: string; amount: number; frequency: "monthly" | "quarterly" | "annual" }[];
}

// What a given grade is billed, split into one-time (admission fee, etc.) and
// recurring (tuition, etc.) — used by the admissions enroll dialog to show
// the fee before collecting it, without needing the student to exist yet.
export async function getFeeStructuresForGrade(academicYearId: string, gradeLevel: number): Promise<FeeStructureLookup> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: grade } = await supabaseAdmin
    .from("grades")
    .select("id")
    .eq("school_id", schoolId)
    .eq("level", gradeLevel)
    .maybeSingle();

  if (!grade) return { oneTime: [], recurring: [] };

  const { data: structures } = await supabaseAdmin
    .from("fee_structures")
    .select("category, amount, frequency, is_one_time, grade_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .or(`grade_id.eq.${grade.id},grade_id.is.null`);

  const rows = structures ?? [];
  const oneTimeRows = pickGradeApplicable(rows.filter((r) => r.is_one_time), grade.id);
  const recurringRows = pickGradeApplicable(rows.filter((r) => !r.is_one_time), grade.id);

  return {
    oneTime: oneTimeRows.map((r) => ({ category: r.category, amount: Number(r.amount) })),
    recurring: recurringRows.map((r) => ({ category: r.category, amount: Number(r.amount), frequency: (r.frequency as FeeStructureLookup["recurring"][number]["frequency"]) ?? "monthly" })),
  };
}

// ── Monthly fee generation ────────────────────────────────────────────────────

interface StudentGradeRow {
  id: string;
  sections: { grade_id: string | null } | null;
}

// Fee structures bill on their own cadence relative to the academic year's start
// month: monthly categories every month, quarterly every 3rd month, annual once
// (the start month only) — so "amount" is always the amount due for that billing
// event, never prorated.
function monthOffset(startDate: string, monthStr: string): number {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [targetYear, targetMonth] = monthStr.split("-").map(Number);
  return (targetYear - startYear) * 12 + (targetMonth - startMonth);
}

function frequencyAppliesToMonth(frequency: "monthly" | "quarterly" | "annual", offset: number): boolean {
  if (offset < 0) return false;
  if (frequency === "monthly") return true;
  if (frequency === "quarterly") return offset % 3 === 0;
  return offset === 0; // annual
}

export async function generateMonthlyFees(monthStr: string): Promise<{ created: number }> {
  await requireFeeManagerRole();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: structures }, { data: academicYear }] = await Promise.all([
    supabaseAdmin
      .from("fee_structures")
      .select("grade_id, category, amount, frequency, is_one_time")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),
    supabaseAdmin
      .from("academic_years")
      .select("start_date")
      .eq("id", academicYearId)
      .single(),
  ]);

  if (!structures || structures.length === 0) {
    throw new Error("No fee structure configured yet — add fee categories first.");
  }
  if (!academicYear?.start_date) {
    throw new Error("Current academic year has no start date set — check Settings.");
  }

  const offset = monthOffset(academicYear.start_date, monthStr);
  const dueStructures = structures
    .filter((s) => !s.is_one_time) // one-time fees (admission fee, etc.) bill only at enrollment, never here
    .filter((s) => frequencyAppliesToMonth(s.frequency as "monthly" | "quarterly" | "annual", offset));

  if (dueStructures.length === 0) {
    return { created: 0 };
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
    for (const structure of dueStructures) {
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

    // A freshly-inserted row is always unpaid, so every affected student is
    // now (at least) overdue — no need to re-derive from their full history.
    const affectedStudentIds = [...new Set(rowsToInsert.map((r) => r.student_id))];
    await supabaseAdmin.from("students").update({ fee_status: "overdue" }).in("id", affectedStudentIds);

    await logAuditEvent({
      schoolId,
      action: "create",
      module: "Fees",
      description: `Generated ${rowsToInsert.length} fee record${rowsToInsert.length === 1 ? "" : "s"} for ${monthStr}`,
    });
  }

  revalidatePath("/dashboard/fees");
  revalidatePath("/dashboard/fees/structure");
  return { created: rowsToInsert.length };
}
