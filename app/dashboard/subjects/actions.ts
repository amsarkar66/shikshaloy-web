"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

export interface CreateSubjectInput {
  name:          string;
  code:          string;
  type:          "core" | "elective";
  weeklyPeriods?: number | null;
}

export async function createSubject(input: CreateSubjectInput): Promise<{ id: string }> {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!name) throw new Error("Subject name is required.");
  if (!code) throw new Error("Subject code is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("subjects")
    .insert({
      school_id:      schoolId,
      name,
      code,
      type:           input.type,
      weekly_periods: input.weeklyPeriods && input.weeklyPeriods > 0 ? input.weeklyPeriods : 5,
      status:         "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Subject code "${code}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/subjects");
  return { id: data.id };
}

export interface UpdateSubjectInput {
  id:             string;
  name:           string;
  code:           string;
  type:           "core" | "elective";
  weeklyPeriods?: number | null;
  status:         "active" | "inactive";
}

export async function updateSubject(input: UpdateSubjectInput): Promise<void> {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!name) throw new Error("Subject name is required.");
  if (!code) throw new Error("Subject code is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("subjects")
    .update({
      name,
      code,
      type:           input.type,
      weekly_periods: input.weeklyPeriods && input.weeklyPeriods > 0 ? input.weeklyPeriods : 5,
      status:         input.status,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`Subject code "${code}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/subjects");
  revalidatePath(`/dashboard/subjects/${input.id}`);
}

export async function deleteSubject(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { count: assignmentCount } = await supabaseAdmin
    .from("section_subjects")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", id);

  if (assignmentCount && assignmentCount > 0) {
    throw new Error(`Cannot delete — this subject is assigned to ${assignmentCount} section${assignmentCount === 1 ? "" : "s"}. Remove those assignments first, or mark it Inactive instead.`);
  }

  const { error } = await supabaseAdmin
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/subjects");
}

export interface AssignSubjectInput {
  subjectId:      string;
  sectionId:      string;
  teacherId?:     string | null;
  weeklyPeriods?: number | null;
}

export async function assignSubjectToSection(input: AssignSubjectInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { error } = await supabaseAdmin
    .from("section_subjects")
    .upsert(
      {
        school_id:        schoolId,
        section_id:       input.sectionId,
        subject_id:       input.subjectId,
        academic_year_id: academicYearId,
        teacher_id:       input.teacherId || null,
        weekly_periods:   input.weeklyPeriods && input.weeklyPeriods > 0 ? input.weeklyPeriods : null,
      },
      { onConflict: "section_id,subject_id,academic_year_id" },
    );

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/subjects/${input.subjectId}`);
  revalidatePath("/dashboard/subjects");
}

export interface UpdateAssignmentInput {
  id:             string;
  subjectId:      string;
  teacherId?:     string | null;
  weeklyPeriods?: number | null;
}

export async function updateSubjectAssignment(input: UpdateAssignmentInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("section_subjects")
    .update({
      teacher_id:     input.teacherId || null,
      weekly_periods: input.weeklyPeriods && input.weeklyPeriods > 0 ? input.weeklyPeriods : null,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/subjects/${input.subjectId}`);
}

export async function removeSubjectAssignment(id: string, subjectId: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("section_subjects")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/subjects/${subjectId}`);
}
