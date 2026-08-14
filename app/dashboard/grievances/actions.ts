"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";

export type GrievanceStatus = "open" | "in_review" | "resolved";

export async function updateGrievanceStatus(
  id: string,
  status: GrievanceStatus,
  resolutionNotes?: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "kernel")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabaseAdmin
    .from("grievances")
    .update({
      status,
      resolution_notes: resolutionNotes?.trim() || null,
      resolved_by: status === "resolved" ? user.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/grievances");
  revalidatePath("/dashboard/support");
}
