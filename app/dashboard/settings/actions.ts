"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateStaffType } from "@/lib/supabase/admin";

export async function assignStaffTemplate(
  userId: string,
  staffType: string,
  staffTemplateId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  const ok = await updateStaffType(userId, staffType, staffTemplateId);
  if (!ok) throw new Error("Failed to update staff type");

  revalidatePath("/dashboard/settings");
}
