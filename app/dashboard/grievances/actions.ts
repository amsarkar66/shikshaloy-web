"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";

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
  // grievances belonging to a school they're authorized for — resolved from
  // the record itself (not the "active school" cookie), so a super_admin
  // viewing grievances combined across their institution can act on any of
  // them without first switching the active school to match.
  if (role !== "kernel") {
    const schoolId = await resolveAuthorizedSchoolId("grievances", id);
    query = query.eq("school_id", schoolId);
  }

  const { error } = await query;

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/grievances");
  revalidatePath("/dashboard/support");
}
