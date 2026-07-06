"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";

export async function addExpense(input: {
  category: string;
  description: string;
  vendor: string;
  amount: number;
  date: string;
  receiptRef?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;
  if (!role || !["admin", "super_admin", "staff"].includes(role)) {
    throw new Error("Unauthorized");
  }

  if (!input.category || !input.amount || input.amount <= 0) {
    throw new Error("Category and a valid amount are required.");
  }

  const { error } = await supabaseAdmin.from("expenses").insert({
    school_id: DEMO_SCHOOL_ID,
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
