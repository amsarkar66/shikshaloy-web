"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";

export async function schedulePtmSession(input: {
  sectionId: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  totalSlots: number;
}) {
  const { error } = await supabaseAdmin.from("ptm_sessions").insert({
    school_id: DEMO_SCHOOL_ID,
    academic_year_id: DEMO_AY_ID,
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
  revalidatePath("/dashboard/events");
}
