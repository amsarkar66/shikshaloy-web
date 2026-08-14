import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { listAcademicYears } from "@/lib/academic-years/actions";
import PromoteStudentsClient, {
  type PromoteStudent, type PromoteYear,
} from "./_components/PromoteStudentsClient";
import CreateNextYearPrompt from "./_components/CreateNextYearPrompt";

interface StudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  section_id: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface SectionRow {
  id: string;
  name: string | null;
  academic_year_id: string;
  grades: { level: number | null } | null;
}

export default async function PromoteStudentsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const currentYearId = await getCurrentAcademicYearId();
  const academicYears = await listAcademicYears();
  const currentYear = academicYears.find((y) => y.id === currentYearId);
  const candidateYears = academicYears
    .filter((y) => y.id !== currentYearId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (candidateYears.length === 0) {
    return <CreateNextYearPrompt currentYearName={currentYear?.name ?? "the current year"} />;
  }

  const { data: gradeRows } = await supabaseAdmin
    .from("grades")
    .select("level")
    .eq("school_id", schoolId);

  const maxGradeLevel = Math.max(0, ...((gradeRows ?? []).map((g) => g.level ?? 0)));

  const { data: studentRows } = await supabaseAdmin
    .from("students")
    .select("id, full_name, roll_no, section_id, sections ( name, grades ( level ) )")
    .eq("school_id", schoolId)
    .eq("academic_year_id", currentYearId)
    .eq("status", "active")
    .order("full_name");

  const students: PromoteStudent[] = ((studentRows ?? []) as unknown as StudentRow[])
    .filter((s) => s.sections?.grades?.level != null)
    .map((s) => ({
      id: s.id,
      name: s.full_name,
      rollNo: s.roll_no ?? "",
      sectionId: s.section_id ?? "",
      sectionName: s.sections?.name ?? "",
      gradeLevel: s.sections!.grades!.level as number,
    }));

  const candidateYearIds = candidateYears.map((y) => y.id);

  const [{ data: sectionRows }, { data: enrolledRows }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, academic_year_id, grades ( level )")
      .eq("school_id", schoolId)
      .in("academic_year_id", candidateYearIds),

    supabaseAdmin
      .from("students")
      .select("section_id")
      .eq("school_id", schoolId)
      .in("academic_year_id", candidateYearIds),
  ]);

  const enrolledCount: Record<string, number> = {};
  for (const r of enrolledRows ?? []) {
    if (r.section_id) enrolledCount[r.section_id] = (enrolledCount[r.section_id] ?? 0) + 1;
  }

  const years: PromoteYear[] = candidateYears.map((y) => ({
    id: y.id,
    name: y.name,
    sections: ((sectionRows ?? []) as unknown as SectionRow[])
      .filter((s) => s.academic_year_id === y.id && s.grades?.level != null)
      .map((s) => ({
        id: s.id,
        name: s.name ?? "",
        gradeLevel: s.grades!.level as number,
        enrolled: enrolledCount[s.id] ?? 0,
      })),
  }));

  return <PromoteStudentsClient maxGradeLevel={maxGradeLevel} students={students} years={years} />;
}
