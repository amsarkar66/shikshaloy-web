import { supabaseAdmin } from "@/lib/supabase/service";

export interface ParentChild {
  id: string;
  fullName: string;
  rollNo: string;
  photoUrl: string | null;
  sectionId: string | null;
  sectionName: string | null;
  gradeLevel: number | null;
  academicYearId: string | null;
  attendancePct: number;
  feeStatus: string;
  relationship: string;
  isPrimary: boolean;
}

export interface ParentContext {
  id: string;
  schoolId: string;
  fullName: string;
  children: ParentChild[];
}

interface StudentLinkRow {
  relationship: string | null;
  is_primary: boolean | null;
  students: {
    id: string;
    full_name: string;
    roll_no: string | null;
    photo_url: string | null;
    attendance_pct: number | null;
    fee_status: string | null;
    section_id: string | null;
    academic_year_id: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
}

export async function getParentContext(profileId: string): Promise<ParentContext | null> {
  const { data: parentRow } = await supabaseAdmin
    .from("parents")
    .select("id, school_id, full_name")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!parentRow) return null;

  const { data: linkRows } = await supabaseAdmin
    .from("student_parents")
    .select(`
      relationship, is_primary,
      students (
        id, full_name, roll_no, photo_url, attendance_pct, fee_status,
        section_id, academic_year_id,
        sections ( name, grades ( level ) )
      )
    `)
    .eq("parent_id", parentRow.id);

  const children: ParentChild[] = ((linkRows ?? []) as unknown as StudentLinkRow[])
    .filter((r) => r.students)
    .map((r) => {
      const s = r.students!;
      return {
        id: s.id,
        fullName: s.full_name,
        rollNo: s.roll_no ?? "",
        photoUrl: s.photo_url,
        sectionId: s.section_id,
        sectionName: s.sections?.name ?? null,
        gradeLevel: s.sections?.grades?.level ?? null,
        academicYearId: s.academic_year_id,
        attendancePct: Number(s.attendance_pct ?? 0),
        feeStatus: s.fee_status ?? "overdue",
        relationship: r.relationship ?? "parent",
        isPrimary: !!r.is_primary,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return {
    id: parentRow.id,
    schoolId: parentRow.school_id,
    fullName: parentRow.full_name,
    children,
  };
}
