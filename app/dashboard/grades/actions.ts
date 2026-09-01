"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { getTeacherContext } from "@/lib/teachers/context";
import { MAX_MARKS } from "../exams/_data/exams";
import { resolveGrade } from "@/lib/exams/grading";
import { getSchoolGradeBands } from "@/lib/exams/grading-data";

const MARKS_ENTRY_ROLES = new Set(["admin", "staff", "super_admin", "kernel"]);

// Only an admin/staff role, the teacher assigned to this exact
// section+subject, or a teacher explicitly granted access for this exam
// (Exam Preference > Marks Entry Permission) may write marks — closes a gap
// where the UI filtered combos per-teacher but the actions themselves
// accepted any subject/section.
async function assertCanEditMarks(examId: string, sectionId: string, subjectId: string) {
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Sign-in required.");

  const role = vu.role ?? "";
  if (MARKS_ENTRY_ROLES.has(role)) return;

  if (role === "teacher") {
    const teacher = await getTeacherContext(vu.id);
    const assigned = teacher?.subjectAssignments.some(
      (a) => a.sectionId === sectionId && a.subjectId === subjectId,
    );
    if (assigned) return;

    const { data: grant } = await supabaseAdmin
      .from("marks_entry_grants")
      .select("id, section_subjects!inner(section_id, subject_id)")
      .eq("exam_id", examId)
      .eq("staff_profile_id", vu.id)
      .eq("section_subjects.section_id", sectionId)
      .eq("section_subjects.subject_id", subjectId)
      .maybeSingle();
    if (grant) return;
  }

  throw new Error("You are not authorized to enter marks for this class and subject.");
}

export async function saveExamResults(
  examId: string,
  sectionId: string,
  subjectId: string,
  rows: { studentId: string; marks: number; isAbsent: boolean }[],
) {
  await assertCanEditMarks(examId, sectionId, subjectId);
  const schoolId = await getCurrentSchoolIdOrThrow();
  const gradeBands = await getSchoolGradeBands(schoolId);
  const payload = rows.map((r) => ({
    school_id: schoolId,
    exam_id: examId,
    student_id: r.studentId,
    subject_id: subjectId,
    marks_obtained: r.isAbsent ? 0 : r.marks,
    max_marks: MAX_MARKS,
    grade: r.isAbsent ? resolveGrade(0, gradeBands) : resolveGrade(Math.round((r.marks / MAX_MARKS) * 100), gradeBands),
    is_absent: r.isAbsent,
  }));

  const { error } = await supabaseAdmin
    .from("exam_results")
    .upsert(payload, { onConflict: "exam_id,student_id,subject_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/grades");
  revalidatePath("/dashboard/exams");
}

export async function deleteExamResult(examId: string, sectionId: string, subjectId: string, studentId: string) {
  await assertCanEditMarks(examId, sectionId, subjectId);
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("exam_results")
    .delete()
    .eq("school_id", schoolId)
    .eq("exam_id", examId)
    .eq("subject_id", subjectId)
    .eq("student_id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/grades");
  revalidatePath("/dashboard/exams");
}
