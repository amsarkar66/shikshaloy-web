"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { requireRole, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";

export async function addExpense(input: {
  category: string;
  description: string;
  vendor: string;
  amount: number;
  date: string;
  receiptRef?: string;
}) {
  await requireRoleOrStaffTemplate(["admin", "super_admin"], ["accountant"]);
  const schoolId = await getCurrentSchoolIdOrThrow();

  if (!input.category || !input.amount || input.amount <= 0) {
    throw new Error("Category and a valid amount are required.");
  }

  const { error } = await supabaseAdmin.from("expenses").insert({
    school_id: schoolId,
    date: input.date,
    month_str: input.date.slice(0, 7),
    category: input.category,
    description: input.description || null,
    vendor: input.vendor || null,
    amount: input.amount,
    status: "pending",
    receipt_ref: input.receiptRef || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/expenses");
}

export async function updateExpenseStatus(expenseId: string, status: "approved" | "rejected") {
  try {
    await requireRole(["admin", "super_admin"]);
  } catch {
    throw new Error("Only an admin can approve or reject an expense.");
  }
  const schoolId = await resolveAuthorizedSchoolId("expenses", expenseId);

  const { error } = await supabaseAdmin
    .from("expenses")
    .update({ status })
    .eq("id", expenseId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/expenses");
}
