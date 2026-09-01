"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";

async function assertAuthorized() {
  await requireRoleOrStaffTemplate(["admin", "super_admin"], ["accountant", "hr_manager"]);
}

function generateSlipNo(monthStr: string): string {
  return `SLP-${monthStr.replace("-", "")}-${Math.floor(Math.random() * 9000) + 1000}`;
}

export async function processSalary(
  staffId: string,
  monthStr: string,
  paidOn: string,
  payMode: "bank_transfer" | "cheque"
) {
  await assertAuthorized();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("payroll_records")
    .update({
      status: "processed",
      paid_on: paidOn,
      pay_mode: payMode,
      slip_no: generateSlipNo(monthStr),
    })
    .eq("school_id", schoolId)
    .eq("staff_id", staffId)
    .eq("month_str", monthStr)
    .is("slip_no", null);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/payroll");
}

export async function processAllPending(monthStr: string) {
  await assertAuthorized();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const paidOn = new Date().toISOString().slice(0, 10);
  const { error } = await supabaseAdmin
    .from("payroll_records")
    .update({
      status: "processed",
      paid_on: paidOn,
      pay_mode: "bank_transfer",
      slip_no: generateSlipNo(monthStr),
    })
    .eq("school_id", schoolId)
    .eq("month_str", monthStr)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/payroll");
}
