"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

export async function assignHomework(input: {
  title: string;
  subjectId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  description: string;
}) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("homework").insert({
    school_id: schoolId,
    academic_year_id: await getCurrentAcademicYearId(),
    title: input.title,
    subject_id: input.subjectId,
    section_id: input.sectionId,
    teacher_id: input.teacherId,
    assigned_date: new Date().toISOString().slice(0, 10),
    due_date: input.dueDate,
    description: input.description,
    status: "active",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
}

export async function submitHomework(homeworkId: string, studentId: string) {
  const { error } = await supabaseAdmin
    .from("homework_submissions")
    .insert({ homework_id: homeworkId, student_id: studentId });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
}
