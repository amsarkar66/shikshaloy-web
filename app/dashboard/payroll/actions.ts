"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";

async function assertAuthorized() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;
  if (!role || !["admin", "super_admin", "staff"].includes(role)) {
    throw new Error("Unauthorized");
  }
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

  const { error } = await supabaseAdmin
    .from("payroll_records")
    .update({
      status: "processed",
      paid_on: paidOn,
      pay_mode: payMode,
      slip_no: generateSlipNo(monthStr),
    })
    .eq("school_id", DEMO_SCHOOL_ID)
    .eq("staff_id", staffId)
    .eq("month_str", monthStr)
    .is("slip_no", null);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/payroll");
}

export async function processAllPending(monthStr: string) {
  await assertAuthorized();

  const paidOn = new Date().toISOString().slice(0, 10);
  const { error } = await supabaseAdmin
    .from("payroll_records")
    .update({
      status: "processed",
      paid_on: paidOn,
      pay_mode: "bank_transfer",
      slip_no: generateSlipNo(monthStr),
    })
    .eq("school_id", DEMO_SCHOOL_ID)
    .eq("month_str", monthStr)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/payroll");
}
