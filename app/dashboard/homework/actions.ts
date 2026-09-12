"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";
import { getVerifiedUser, isAdmin } from "@/lib/auth/verified-role";
import { assertAuthorizedSchool } from "@/lib/supabase/authorized-school";

// admin/super_admin may act on any homework in their own school (verified
// via assertAuthorizedSchool, not just "some admin somewhere" — this used
// to return for ANY admin/super_admin regardless of which school the
// homework belonged to); a teacher may only act on homework they
// themselves assigned — mirrors the `canEdit` check already enforced
// client-side in homework/[id]/page.tsx.
async function assertHomeworkOwnerOrAdmin(teacherId: string, schoolId: string) {
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");

  if (vu.role === "admin" || vu.role === "super_admin" || (await isAdmin(vu))) {
    await assertAuthorizedSchool(vu, schoolId);
    return;
  }

  if (vu.role === "teacher") {
    const teacher = await getTeacherContext(vu.id);
    if (teacher && teacher.staffId === teacherId) return;
  }

  throw new Error("Unauthorized");
}

export async function assignHomework(input: {
  title: string;
  subjectId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  description: string;
}) {
  const vu = await getVerifiedUser();
  if (!vu || (!["admin", "super_admin", "teacher"].includes(vu.role) && !(await isAdmin(vu)))) throw new Error("Unauthorized");

  const schoolId = await getCurrentSchoolIdOrThrow();

  // Same class of bug as assignSubjectToSection: verify subjectId/sectionId/
  // teacherId actually belong to this school before tagging the insert with
  // it, and that a teacher can only assign homework as themselves.
  const [{ data: section }, { data: subject }, { data: teacher }] = await Promise.all([
    supabaseAdmin.from("sections").select("id").eq("id", input.sectionId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("subjects").select("id").eq("id", input.subjectId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("staff_members").select("id").eq("id", input.teacherId).eq("school_id", schoolId).maybeSingle(),
  ]);
  if (!section) throw new Error("Section not found");
  if (!subject) throw new Error("Subject not found");
  if (!teacher) throw new Error("Teacher not found");

  if (vu.role === "teacher") {
    const ctx = await getTeacherContext(vu.id);
    if (!ctx || ctx.staffId !== input.teacherId) throw new Error("You can only assign homework as yourself");
  }

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

export async function updateHomework(homeworkId: string, input: {
  title: string;
  subjectId: string;
  sectionId: string;
  teacherId: string;
  dueDate: string;
  description: string;
}) {
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: hw } = await supabaseAdmin
    .from("homework")
    .select("teacher_id")
    .eq("id", homeworkId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!hw) throw new Error("Homework not found");
  await assertHomeworkOwnerOrAdmin(hw.teacher_id, schoolId);

  const [{ data: section }, { data: subject }, { data: teacher }] = await Promise.all([
    supabaseAdmin.from("sections").select("id").eq("id", input.sectionId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("subjects").select("id").eq("id", input.subjectId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("staff_members").select("id").eq("id", input.teacherId).eq("school_id", schoolId).maybeSingle(),
  ]);
  if (!section) throw new Error("Section not found");
  if (!subject) throw new Error("Subject not found");
  if (!teacher) throw new Error("Teacher not found");

  if (vu.role === "teacher") {
    const ctx = await getTeacherContext(vu.id);
    if (!ctx || ctx.staffId !== input.teacherId) throw new Error("You can only assign homework as yourself");
  }

  const { error } = await supabaseAdmin
    .from("homework")
    .update({
      title: input.title,
      subject_id: input.subjectId,
      section_id: input.sectionId,
      teacher_id: input.teacherId,
      due_date: input.dueDate,
      description: input.description,
    })
    .eq("id", homeworkId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${homeworkId}`);
}

export async function deleteHomework(homeworkId: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: hw } = await supabaseAdmin
    .from("homework")
    .select("teacher_id")
    .eq("id", homeworkId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!hw) throw new Error("Homework not found");
  await assertHomeworkOwnerOrAdmin(hw.teacher_id, schoolId);

  // homework_submissions has ON DELETE CASCADE on homework_id, so student
  // submissions for this assignment are removed automatically.
  const { error } = await supabaseAdmin
    .from("homework")
    .delete()
    .eq("id", homeworkId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
}

async function assertOwnStudentOrStaff(homeworkId: string, studentId: string) {
  const { data: hw } = await supabaseAdmin
    .from("homework")
    .select("status, teacher_id, school_id")
    .eq("id", homeworkId)
    .maybeSingle();
  if (!hw) throw new Error("Homework not found");
  if (hw.status === "closed") throw new Error("This homework is closed and no longer accepting submissions.");

  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");

  const student = await getStudentContext(vu.id);
  if (student && student.id === studentId && student.schoolId === hw.school_id) return;

  await assertHomeworkOwnerOrAdmin(hw.teacher_id, hw.school_id);
}

export async function submitHomework(homeworkId: string, studentId: string) {
  await assertOwnStudentOrStaff(homeworkId, studentId);

  const { error } = await supabaseAdmin
    .from("homework_submissions")
    .insert({ homework_id: homeworkId, student_id: studentId });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${homeworkId}`);
}

export async function unsubmitHomework(homeworkId: string, studentId: string) {
  await assertOwnStudentOrStaff(homeworkId, studentId);

  const { error } = await supabaseAdmin
    .from("homework_submissions")
    .delete()
    .eq("homework_id", homeworkId)
    .eq("student_id", studentId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${homeworkId}`);
}

export async function setHomeworkStatus(homeworkId: string, status: "active" | "closed") {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: hw } = await supabaseAdmin
    .from("homework")
    .select("teacher_id")
    .eq("id", homeworkId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!hw) throw new Error("Homework not found");
  await assertHomeworkOwnerOrAdmin(hw.teacher_id, schoolId);

  const { error } = await supabaseAdmin
    .from("homework")
    .update({ status })
    .eq("id", homeworkId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${homeworkId}`);
}
