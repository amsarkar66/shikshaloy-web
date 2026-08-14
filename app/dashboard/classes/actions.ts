"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

export interface CreateSectionInput {
  classNum:      string;
  section:       string;
  room?:         string | null;
  capacity?:     number | null;
  classTeacherId?: string | null;
}

async function findOrCreateGrade(schoolId: string, level: number) {
  const { data: existing } = await supabaseAdmin
    .from("grades")
    .select("id")
    .eq("school_id", schoolId)
    .eq("level", level)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("grades")
    .insert({ school_id: schoolId, name: `Class ${level}`, level })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create class.");
  return created.id;
}

export async function createSection(input: CreateSectionInput): Promise<{ id: string }> {
  const level = Number(input.classNum);
  const sectionName = input.section.trim();

  if (!Number.isFinite(level) || level <= 0) throw new Error("Enter a valid class number.");
  if (!sectionName) throw new Error("Section name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();
  const gradeId = await findOrCreateGrade(schoolId, level);

  const { data, error } = await supabaseAdmin
    .from("sections")
    .insert({
      school_id: schoolId,
      grade_id: gradeId,
      academic_year_id: academicYearId,
      name: sectionName,
      room: input.room?.trim() || null,
      capacity: input.capacity && input.capacity > 0 ? input.capacity : 40,
      class_teacher_id: input.classTeacherId || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Section ${level}-${sectionName} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/classes");
  return { id: data.id };
}

export interface UpdateSectionInput {
  id:              string;
  section:         string;
  room?:           string | null;
  capacity?:       number | null;
  classTeacherId?: string | null;
  status:          "active" | "inactive";
}

export async function updateSection(input: UpdateSectionInput): Promise<void> {
  const sectionName = input.section.trim();
  if (!sectionName) throw new Error("Section name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("sections")
    .update({
      name: sectionName,
      room: input.room?.trim() || null,
      capacity: input.capacity && input.capacity > 0 ? input.capacity : 40,
      class_teacher_id: input.classTeacherId || null,
      status: input.status,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`A section named "${sectionName}" already exists in this class.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${input.id}`);
}
