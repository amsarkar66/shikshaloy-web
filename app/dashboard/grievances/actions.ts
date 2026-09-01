"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

export type GrievanceStatus = "open" | "in_review" | "resolved";

export async function updateGrievanceStatus(
  id: string,
  status: GrievanceStatus,
  resolutionNotes?: string
): Promise<void> {
  const { id: userId, role } = await requireRole(["admin", "super_admin", "kernel"] as const);

  let query = supabaseAdmin
    .from("grievances")
    .update({
      status,
      resolution_notes: resolutionNotes?.trim() || null,
      resolved_by: status === "resolved" ? userId : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // kernel isn't tied to a single school; every other role may only touch
  // grievances belonging to their own school.
  if (role !== "kernel") {
    const schoolId = await getCurrentSchoolIdOrThrow();
    query = query.eq("school_id", schoolId);
  }

  const { error } = await query;

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/grievances");
  revalidatePath("/dashboard/support");
}
