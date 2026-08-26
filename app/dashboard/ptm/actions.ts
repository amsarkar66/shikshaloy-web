"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

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
  parentId: string;
  slotTime: string;
}) {
  const { error } = await supabaseAdmin.from("ptm_bookings").insert({
    session_id: input.sessionId,
    student_id: input.studentId,
    parent_id: input.parentId,
    slot_time: input.slotTime,
    status: "booked",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ptm");
  revalidatePath("/dashboard");
}

export async function cancelPtmBooking(bookingId: string, parentId: string) {
  const { error } = await supabaseAdmin
    .from("ptm_bookings")
    .delete()
    .eq("id", bookingId)
    .eq("parent_id", parentId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ptm");
  revalidatePath("/dashboard");
}
