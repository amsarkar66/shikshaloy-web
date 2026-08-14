"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getGrade, MAX_MARKS } from "../exams/_data/exams";

export async function saveExamResults(
  examId: string,
  subjectId: string,
  rows: { studentId: string; marks: number; isAbsent: boolean }[],
) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const payload = rows.map((r) => ({
    school_id: schoolId,
    exam_id: examId,
    student_id: r.studentId,
    subject_id: subjectId,
    marks_obtained: r.isAbsent ? 0 : r.marks,
    max_marks: MAX_MARKS,
    grade: r.isAbsent ? "F" : getGrade(Math.round((r.marks / MAX_MARKS) * 100)),
    is_absent: r.isAbsent,
  }));

  const { error } = await supabaseAdmin
    .from("exam_results")
    .upsert(payload, { onConflict: "exam_id,student_id,subject_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/grades");
  revalidatePath("/dashboard/exams");
}
