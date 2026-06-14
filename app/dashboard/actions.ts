"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateInstitutionStatus } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function approveInstitution(formData: FormData) {
  const userId = formData.get("userId") as string;
  await updateInstitutionStatus(userId, "active");
  revalidatePath("/dashboard");
}

export async function rejectInstitution(formData: FormData) {
  const userId = formData.get("userId") as string;
  await updateInstitutionStatus(userId, "rejected");
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
