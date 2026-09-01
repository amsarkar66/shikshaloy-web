"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { logAuditEvent } from "@/lib/audit/log";
import { requireRole } from "@/lib/auth/verified-role";

// ── Authorization ────────────────────────────────────────────────────────────
// Subject attendance can be marked by admin/super_admin (any slot in the
// school), or a teacher — but only for a timetable_slots row where they are
// the scheduled teacher_id. That column is the ground truth for "who teaches
// this specific period" (it can diverge from a teacher's general subject
// assignment when schedules change or a slot is reassigned), so authorization
// is checked against it directly rather than getTeacherContext().

interface SubjectMarkerContext {
  role: "admin" | "super_admin" | "teacher";
  userId: string;
  teacherProfileId: string | null; // null = unrestricted (admin/super_admin)
}

async function requireSubjectAttendanceMarker(): Promise<SubjectMarkerContext> {
  const { id, role } = await requireRole(["admin", "super_admin", "teacher"] as const);

  if (role === "admin" || role === "super_admin") return { role, userId: id, teacherProfileId: null };
  return { role, userId: id, teacherProfileId: id };
}

function assertCanMarkSlot(marker: SubjectMarkerContext, slotTeacherId: string | null) {
  if (marker.teacherProfileId && slotTeacherId !== marker.teacherProfileId) {
    throw new Error("You can only mark attendance for your own class");
  }
}

interface SlotRow {
  school_id: string;
  section_id: string;
  subject_id: string;
  teacher_id: string | null;
  period_number: number;
  subjects: { name: string | null } | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

async function loadSlot(timetableSlotId: string): Promise<SlotRow> {
  const { data } = await supabaseAdmin
    .from("timetable_slots")
    .select("school_id, section_id, subject_id, teacher_id, period_number, subjects ( name ), sections ( name, grades ( level ) )")
    .eq("id", timetableSlotId)
    .maybeSingle<SlotRow>();
  if (!data) throw new Error("Class period not found");
  return data;
}

/** Fetches (or creates, if missing) the session row for this slot+date, returning its id. */
async function ensureSession(
  slot: SlotRow, timetableSlotId: string, date: string, markerId: string, conducted: boolean, remarks?: string | null,
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("subject_attendance_sessions")
    .upsert(
      {
        school_id: slot.school_id,
        timetable_slot_id: timetableSlotId,
        section_id: slot.section_id,
        subject_id: slot.subject_id,
        teacher_id: slot.teacher_id,
        date,
        period_number: slot.period_number,
        conducted,
        remarks: remarks ?? null,
        taken_by: markerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "timetable_slot_id,date" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

function classLabel(slot: SlotRow) {
  return `${slot.subjects?.name ?? "Subject"} — Class ${slot.sections?.grades?.level ?? "?"}-${slot.sections?.name ?? ""}`;
}

export async function markSubjectAttendance(timetableSlotId: string, date: string, studentId: string, status: "present" | "absent") {
  const marker = await requireSubjectAttendanceMarker();
  const slot = await loadSlot(timetableSlotId);
  assertCanMarkSlot(marker, slot.teacher_id);

  const sessionId = await ensureSession(slot, timetableSlotId, date, marker.userId, true);

  const { error } = await supabaseAdmin
    .from("subject_attendance")
    .upsert(
      { school_id: slot.school_id, session_id: sessionId, student_id: studentId, status },
      { onConflict: "session_id,student_id" },
    );
  if (error) throw new Error(error.message);

  const { data: student } = await supabaseAdmin.from("students").select("full_name").eq("id", studentId).maybeSingle();
  await logAuditEvent({
    schoolId: slot.school_id,
    action: "update",
    module: "Attendance",
    description: `Marked ${student?.full_name ?? "a student"} as ${status} in ${classLabel(slot)} (${date})`,
  });

  revalidatePath(`/dashboard/subjects/attendance/${timetableSlotId}`);
  revalidatePath("/dashboard/subjects/attendance");
}

export async function markClassNotConducted(timetableSlotId: string, date: string, remarks?: string) {
  const marker = await requireSubjectAttendanceMarker();
  const slot = await loadSlot(timetableSlotId);
  assertCanMarkSlot(marker, slot.teacher_id);

  const sessionId = await ensureSession(slot, timetableSlotId, date, marker.userId, false, remarks);

  const { error } = await supabaseAdmin.from("subject_attendance").delete().eq("session_id", sessionId);
  if (error) throw new Error(error.message);

  await logAuditEvent({
    schoolId: slot.school_id,
    action: "update",
    module: "Attendance",
    description: `Marked ${classLabel(slot)} as not conducted (${date})${remarks ? ` — ${remarks}` : ""}`,
  });

  revalidatePath(`/dashboard/subjects/attendance/${timetableSlotId}`);
  revalidatePath("/dashboard/subjects/attendance");
}
