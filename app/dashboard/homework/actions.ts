"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";

// admin/super_admin may act on any homework in their school; a teacher may
// only act on homework they themselves assigned — mirrors the `canEdit`
// check already enforced client-side in homework/[id]/page.tsx.
async function assertHomeworkOwnerOrAdmin(teacherId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin" || profile?.role === "super_admin") return;

  if (profile?.role === "teacher") {
    const teacher = await getTeacherContext(user.id);
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

async function assertOwnStudentOrStaff(homeworkId: string, studentId: string) {
  const { data: hw } = await supabaseAdmin
    .from("homework")
    .select("status, teacher_id")
    .eq("id", homeworkId)
    .maybeSingle();
  if (!hw) throw new Error("Homework not found");
  if (hw.status === "closed") throw new Error("This homework is closed and no longer accepting submissions.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const student = await getStudentContext(user.id);
  if (student && student.id === studentId) return;

  await assertHomeworkOwnerOrAdmin(hw.teacher_id);
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
  await assertHomeworkOwnerOrAdmin(hw.teacher_id);

  const { error } = await supabaseAdmin
    .from("homework")
    .update({ status })
    .eq("id", homeworkId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/homework");
  revalidatePath(`/dashboard/homework/${homeworkId}`);
}
