"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import { requireRoleOrStaffTemplate, getVerifiedUser, type VerifiedProfile } from "@/lib/auth/verified-role";

// requireRoleOrStaffTemplate only confirms the caller may act as
// admin/super_admin/accountant/hr_manager — it doesn't return schoolId, which
// assertAuthorizedSchool needs to check a school against a super_admin's
// institution (or a non-super_admin's own assigned school). getVerifiedUser()
// is request-cached, so this reuses the same lookup rather than re-querying.
async function assertAuthorized(): Promise<VerifiedProfile> {
  await requireRoleOrStaffTemplate(["admin", "super_admin"], ["accountant", "hr_manager"]);
  return (await getVerifiedUser())!;
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
  const schoolId = await resolveAuthorizedSchoolId("staff_members", staffId);

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

// processAllPending has no single record to resolve a school from (it's a
// whole-school-and-month batch release), so unlike processSalary it takes an
// optional explicit schoolId — validated against the caller when given
// (e.g. from the institution-wide /dashboard/approvals page, releasing a
// specific school's payroll without switching the active-school cookie to
// match), falling back to the active-school cookie when omitted so the
// single-school Payroll page keeps working unchanged.
export async function processAllPending(monthStr: string, schoolIdInput?: string) {
  const vu = await assertAuthorized();
  let schoolId: string;
  if (schoolIdInput) {
    await assertAuthorizedSchool(vu, schoolIdInput);
    schoolId = schoolIdInput;
  } else {
    schoolId = await getCurrentSchoolIdOrThrow();
  }

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
