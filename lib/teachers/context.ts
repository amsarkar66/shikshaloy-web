import { supabaseAdmin } from "@/lib/supabase/service";

export interface TeacherContext {
  id: string;
  staffId: string;
  schoolId: string;
  fullName: string;
  designation: string;
  classTeacherSectionIds: string[];
  subjectAssignments: { sectionId: string; subjectId: string; sectionSubjectId: string; isElective: boolean }[];
  sectionIds: string[];
}

export async function getTeacherContext(profileId: string): Promise<TeacherContext | null> {
  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("id, school_id, full_name, designation")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!staff) return null;

  const [{ data: classTeacherSections }, { data: subjectAssignments }] = await Promise.all([
    supabaseAdmin.from("sections").select("id").eq("class_teacher_id", profileId),
    supabaseAdmin.from("section_subjects").select("id, section_id, subject_id, subjects ( type )").eq("teacher_id", profileId),
  ]);

  const classTeacherSectionIds = (classTeacherSections ?? []).map((s) => s.id);
  const assignments = (subjectAssignments ?? []).map((s) => ({
    sectionId: s.section_id,
    subjectId: s.subject_id,
    sectionSubjectId: s.id,
    isElective: (s.subjects as unknown as { type: string | null } | null)?.type === "elective",
  }));
  const sectionIds = Array.from(new Set([...classTeacherSectionIds, ...assignments.map((a) => a.sectionId)]));

  return {
    id: profileId,
    staffId: staff.id,
    schoolId: staff.school_id,
    fullName: staff.full_name,
    designation: staff.designation ?? "",
    classTeacherSectionIds,
    subjectAssignments: assignments,
    sectionIds,
  };
}
