"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
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
  const { id: userId } = await requireRoleOrStaffTemplate(["admin", "super_admin"], ["hr_manager"]);

  const { data: approver } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .eq("profile_id", userId)
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

// ── Substitute assignment — real timetable slots affected by a teacher's
// leave, real teaching staff as candidates, and a real table backing the
// resulting plan (previously all three were fabricated client-side and the
// "plan" vanished on refresh since nothing persisted it).

const DAY_LABEL: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

export interface AffectedPeriod {
  id: string;
  timetableSlotId: string;
  date: string;
  day: string;
  period: number;
  time: string;
  classSection: string;
  subject: string;
}

export async function getAffectedPeriods(leaveId: string): Promise<AffectedPeriod[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: leave } = await supabaseAdmin
    .from("leave_requests")
    .select("staff_id, from_date, to_date")
    .eq("id", leaveId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!leave) return [];

  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("profile_id")
    .eq("id", leave.staff_id)
    .maybeSingle();
  if (!staff?.profile_id) return [];

  const [{ data: periodRows }, { data: slotRows }] = await Promise.all([
    supabaseAdmin.from("timetable_periods").select("number, start_time, end_time").eq("school_id", schoolId),
    supabaseAdmin
      .from("timetable_slots")
      .select("id, day_of_week, period_number, sections ( name, grades ( level ) ), subjects ( name )")
      .eq("school_id", schoolId)
      .eq("teacher_id", staff.profile_id),
  ]);

  const periodByNumber = new Map((periodRows ?? []).map((p) => [p.number, p]));
  const slotsByDay = new Map<number, NonNullable<typeof slotRows>>();
  for (const s of slotRows ?? []) {
    const list = slotsByDay.get(s.day_of_week) ?? [];
    list.push(s);
    slotsByDay.set(s.day_of_week, list);
  }

  const periods: AffectedPeriod[] = [];
  const cursor = new Date(leave.from_date + "T00:00:00");
  const end = new Date(leave.to_date + "T00:00:00");
  while (cursor <= end) {
    const dow = cursor.getDay();
    const dateStr = cursor.toISOString().slice(0, 10);
    for (const slot of slotsByDay.get(dow) ?? []) {
      const section = slot.sections as unknown as { name: string | null; grades: { level: number | null } | null } | null;
      const subject = slot.subjects as unknown as { name: string | null } | null;
      const p = periodByNumber.get(slot.period_number);
      periods.push({
        id: `${slot.id}:${dateStr}`,
        timetableSlotId: slot.id,
        date: dateStr,
        day: DAY_LABEL[dow] ?? "",
        period: slot.period_number,
        time: p ? `${p.start_time.slice(0, 5)}–${p.end_time.slice(0, 5)}` : "",
        classSection: `${section?.grades?.level ?? "?"}-${section?.name ?? ""}`,
        subject: subject?.name ?? "Subject",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return periods.sort((a, b) => a.date.localeCompare(b.date) || a.period - b.period);
}

export interface SubstituteOption { id: string; name: string }

export async function listAvailableSubstitutes(leaveId: string): Promise<SubstituteOption[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: leave } = await supabaseAdmin
    .from("leave_requests")
    .select("staff_id")
    .eq("id", leaveId)
    .eq("school_id", schoolId)
    .maybeSingle();

  let builder = supabaseAdmin
    .from("staff_members")
    .select("id, full_name")
    .eq("school_id", schoolId)
    .eq("type", "teaching")
    .eq("status", "active");
  if (leave?.staff_id) builder = builder.neq("id", leave.staff_id);

  const { data } = await builder.order("full_name");
  return (data ?? []).map((s) => ({ id: s.id, name: s.full_name ?? "—" }));
}

export interface SubstituteAssignmentInput { timetableSlotId: string; date: string; substituteStaffId: string }

export async function saveLeaveSubstituteAssignments(leaveId: string, assignments: SubstituteAssignmentInput[]): Promise<void> {
  await requireRoleOrStaffTemplate(["admin", "super_admin"], ["hr_manager"]);

  if (assignments.length === 0) return;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("leave_substitute_assignments")
    .upsert(
      assignments.map((a) => ({
        school_id: schoolId,
        leave_request_id: leaveId,
        timetable_slot_id: a.timetableSlotId,
        occurrence_date: a.date,
        substitute_staff_id: a.substituteStaffId,
      })),
      { onConflict: "leave_request_id,timetable_slot_id,occurrence_date" },
    );
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/leaves");
}

export interface SavedSubstituteAssignment { timetableSlotId: string; date: string; substituteStaffId: string; substituteName: string }

export async function getLeaveSubstituteAssignments(leaveId: string): Promise<SavedSubstituteAssignment[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("leave_substitute_assignments")
    .select("timetable_slot_id, occurrence_date, staff_members ( id, full_name )")
    .eq("leave_request_id", leaveId)
    .eq("school_id", schoolId);

  return (data ?? []).map((r) => {
    const sub = r.staff_members as unknown as { id: string; full_name: string | null } | null;
    return {
      timetableSlotId: r.timetable_slot_id,
      date: r.occurrence_date,
      substituteStaffId: sub?.id ?? "",
      substituteName: sub?.full_name ?? "—",
    };
  });
}
