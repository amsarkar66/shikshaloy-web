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

interface StudentRow {
  id: string;
  school_id: string;
  full_name: string;
  roll_no: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

function toContext(data: StudentRow): StudentContext {
  const sections = data.sections;
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

const STUDENT_CONTEXT_SELECT = `
  id, school_id, full_name, roll_no, attendance_pct, fee_status,
  section_id, academic_year_id,
  sections ( name, grades ( level ) )
`;

export async function getStudentContext(profileId: string): Promise<StudentContext | null> {
  const { data } = await supabaseAdmin
    .from("students")
    .select(STUDENT_CONTEXT_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) return null;
  return toContext(data as unknown as StudentRow);
}

export async function getStudentContextById(id: string): Promise<StudentContext | null> {
  const { data } = await supabaseAdmin
    .from("students")
    .select(STUDENT_CONTEXT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  return toContext(data as unknown as StudentRow);
}
