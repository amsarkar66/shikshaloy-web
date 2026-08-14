"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

export interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
}

export async function createAcademicYear(input: CreateAcademicYearInput): Promise<{ id: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: yearRow, error: yearError } = await supabaseAdmin
    .from("academic_years")
    .insert({
      school_id: schoolId,
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      is_current: false,
    })
    .select("id")
    .single();

  if (yearError || !yearRow) throw new Error(`Failed to create academic year: ${yearError?.message}`);

  const sourceYearId = await getCurrentAcademicYearId();

  const { data: sourceSections } = await supabaseAdmin
    .from("sections")
    .select("grade_id, name, room, capacity, class_teacher_id, status")
    .eq("school_id", schoolId)
    .eq("academic_year_id", sourceYearId);

  if (sourceSections && sourceSections.length > 0) {
    const clones = sourceSections.map((s) => ({
      school_id: schoolId,
      academic_year_id: yearRow.id,
      grade_id: s.grade_id,
      name: s.name,
      room: s.room,
      capacity: s.capacity,
      class_teacher_id: s.class_teacher_id,
      status: s.status,
    }));

    const { error: cloneError } = await supabaseAdmin.from("sections").insert(clones);
    if (cloneError) throw new Error(`Failed to set up classes for the new year: ${cloneError.message}`);
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/students/promote");

  return { id: yearRow.id };
}

export interface AcademicYearOption {
  id: string;
  name: string;
  startDate: string;
  isCurrent: boolean;
}

export async function listAcademicYears(): Promise<AcademicYearOption[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("academic_years")
    .select("id, name, start_date, is_current")
    .eq("school_id", schoolId)
    .order("start_date");

  return (data ?? []).map((y) => ({
    id: y.id,
    name: y.name,
    startDate: y.start_date,
    isCurrent: y.is_current ?? false,
  }));
}
