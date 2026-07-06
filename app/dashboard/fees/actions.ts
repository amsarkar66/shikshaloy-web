"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";

export async function recordFeePayment(
  studentId: string,
  monthStr: string,
  amount: number,
  paidDate: string,
  paymentMode: "online" | "cash" | "cheque" | "upi"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!role || !["admin", "super_admin", "staff"].includes(role)) {
    throw new Error("Unauthorized");
  }

  const { data: row } = await supabaseAdmin
    .from("fee_payments")
    .select("id, amount_due, amount_paid, receipt_no")
    .eq("school_id", DEMO_SCHOOL_ID)
    .eq("student_id", studentId)
    .eq("month_str", monthStr)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!row) throw new Error("No fee record found for this student and month");

  const amountDue = Number(row.amount_due);
  const newPaid = Math.min(amountDue, Number(row.amount_paid) + amount);
  const status = newPaid >= amountDue ? "paid" : newPaid > 0 ? "partial" : "overdue";
  const receiptNo = row.receipt_no ?? `RCP-${monthStr.replace("-", "")}-${Math.floor(Math.random() * 9000) + 1000}`;

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

  revalidatePath("/dashboard/fees");
}
