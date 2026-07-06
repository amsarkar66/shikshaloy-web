import { supabaseAdmin } from "@/lib/supabase/service";

export interface StudentContext {
  id: string;
  schoolId: string;
  fullName: string;
  rollNo: string;
  sectionId: string | null;
  sectionName: string | null;
  gradeLevel: number | null;
  academicYearId: string | null;
  attendancePct: number;
  feeStatus: string;
}

export async function getStudentContext(profileId: string): Promise<StudentContext | null> {
  const { data } = await supabaseAdmin
    .from("students")
    .select(`
      id, school_id, full_name, roll_no, attendance_pct, fee_status,
      section_id, academic_year_id,
      sections ( name, grades ( level ) )
    `)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;

  const sections = data.sections as any;

  return {
    id: data.id,
    schoolId: data.school_id,
    fullName: data.full_name,
    rollNo: data.roll_no ?? "",
    sectionId: data.section_id,
    sectionName: sections?.name ?? null,
    gradeLevel: sections?.grades?.level ?? null,
    academicYearId: data.academic_year_id,
    attendancePct: Number(data.attendance_pct ?? 0),
    feeStatus: data.fee_status ?? "overdue",
  };
}
