"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getUser } from "@/lib/supabase/server";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

// Resolves the calling parent's own parent-record id from their session —
// booking/cancelling must never trust a client-supplied parentId, since a
// crafted request could otherwise act as (or against) a different family.
async function getCurrentParentId(): Promise<string> {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!parent) throw new Error("No parent record linked to this account.");
  return parent.id;
}

export async function schedulePtmSession(input: {
  sectionId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  totalSlots: number;
}) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("ptm_sessions").insert({
    school_id: schoolId,
    academic_year_id: await getCurrentAcademicYearId(),
    section_id: input.sectionId,
    teacher_id: input.teacherId,
    date: input.date,
    start_time: input.startTime,
    end_time: input.endTime,
    slot_minutes: input.slotMinutes,
    total_slots: input.totalSlots,
    status: "scheduled",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ptm");
}

export async function bookPtmSlot(input: {
  sessionId: string;
  studentId: string;
  slotTime: string;
}) {
  const parentId = await getCurrentParentId();

  const { data: link } = await supabaseAdmin
    .from("student_parents")
    .select("student_id")
    .eq("parent_id", parentId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (!link) throw new Error("This student isn't linked to your account.");

  const { data: session } = await supabaseAdmin
    .from("ptm_sessions")
    .select("section_id, status")
    .eq("id", input.sessionId)
    .maybeSingle();
  if (!session || session.status !== "scheduled") throw new Error("This session is no longer open for booking.");

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("section_id")
    .eq("id", input.studentId)
    .maybeSingle();
  if (!student || student.section_id !== session.section_id) throw new Error("This student isn't eligible for this session.");

  const { error } = await supabaseAdmin.from("ptm_bookings").insert({
    session_id: input.sessionId,
    student_id: input.studentId,
    parent_id: parentId,
    slot_time: input.slotTime,
    status: "booked",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ptm");
  revalidatePath("/dashboard");
}

export async function cancelPtmBooking(bookingId: string) {
  const parentId = await getCurrentParentId();
  const { error } = await supabaseAdmin
    .from("ptm_bookings")
    .delete()
    .eq("id", bookingId)
    .eq("parent_id", parentId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ptm");
  revalidatePath("/dashboard");
}
