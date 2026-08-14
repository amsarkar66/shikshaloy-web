"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { LeaveType } from "./_data/leaves";

export async function applyLeave(input: {
  staffId: string;
  leaveType: LeaveType;
  from: string;
  to: string;
  reason: string;
}): Promise<{ id: string; days: number }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const fromDate = new Date(input.from + "T00:00:00");
  const toDate = new Date(input.to + "T00:00:00");
  const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);

  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .insert({
      school_id: schoolId,
      staff_id: input.staffId,
      leave_type: input.leaveType,
      from_date: input.from,
      to_date: input.to,
      days,
      reason: input.reason,
      status: "pending",
      applied_on: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to submit leave request");
  revalidatePath("/dashboard/leaves");
  return { id: data.id, days };
}

export async function updateLeaveStatus(leaveId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const staffTemplateId = user?.user_metadata?.staff_template_id as string | undefined;
  const canApprove = role === "admin" || role === "super_admin" || (role === "staff" && staffTemplateId === "hr_manager");
  if (!user || !canApprove) throw new Error("Unauthorized");

  const { data: approver } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  const approvedBy = approver?.id ?? null;

  const { error } = await supabaseAdmin
    .from("leave_requests")
    .update({ status, approved_by: approvedBy })
    .eq("id", leaveId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/leaves");
}
