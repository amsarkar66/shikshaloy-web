"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";

export async function assignHomework(input: {
  title: string;
  subjectId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  description: string;
}) {
  const { error } = await supabaseAdmin.from("homework").insert({
    school_id: DEMO_SCHOOL_ID,
    academic_year_id: DEMO_AY_ID,
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
