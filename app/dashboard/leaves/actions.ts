"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { logAuditEvent } from "@/lib/audit/log";
import { notifyRoles, notifyProfile } from "@/lib/notifications/create";
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

  const { data: staff } = await supabaseAdmin.from("staff_members").select("full_name").eq("id", input.staffId).maybeSingle();
  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Leave",
    description: `${staff?.full_name ?? "A staff member"} applied for ${input.leaveType} leave (${days} day${days === 1 ? "" : "s"})`,
  });

  const { data: { user } } = await getUser();
  await notifyRoles({
    schoolId,
    roles: ["admin", "super_admin"],
    excludeProfileId: user?.id,
    title: "New leave request",
    description: `${staff?.full_name ?? "A staff member"} applied for ${input.leaveType} leave (${days} day${days === 1 ? "" : "s"})`,
    link: "/dashboard/leaves",
  });

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

  const { data: leave, error } = await supabaseAdmin
    .from("leave_requests")
    .update({ status, approved_by: approvedBy })
    .eq("id", leaveId)
    .select("school_id, leave_type, staff_members!leave_requests_staff_id_fkey ( full_name, profile_id )")
    .single();

  if (error) throw new Error(error.message);

  const staffMember = Array.isArray(leave?.staff_members) ? leave?.staff_members[0] : leave?.staff_members;
  const staffInfo = staffMember as { full_name: string | null; profile_id: string | null } | undefined;
  const staffName = staffInfo?.full_name ?? "a staff member";
  await logAuditEvent({
    schoolId: leave.school_id,
    action: status === "approved" ? "approve" : "reject",
    module: "Leave",
    description: `${status === "approved" ? "Approved" : "Rejected"} leave request for ${staffName}`,
  });

  if (staffInfo?.profile_id) {
    await notifyProfile({
      schoolId: leave.school_id,
      profileId: staffInfo.profile_id,
      title: status === "approved" ? "Leave request approved" : "Leave request rejected",
      description: `Your ${leave.leave_type} leave request was ${status}`,
      link: "/dashboard/leaves",
    });
  }

  revalidatePath("/dashboard/leaves");
}
