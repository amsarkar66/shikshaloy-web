import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import SubjectsClient from "./_components/SubjectsClient";
import type { Subject } from "./_components/SubjectsClient";

interface SectionSubjectGradeRow {
  subject_id: string;
  sections: { grades: { level: number | null } | null } | null;
}

export default async function SubjectsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: subjectRows }, { data: ssRows }] = await Promise.all([
    supabaseAdmin
      .from("subjects")
      .select("id, name, code, type, status, weekly_periods")
      .eq("school_id", schoolId)
      .order("name"),

    supabaseAdmin
      .from("section_subjects")
      .select("subject_id, sections ( grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),
  ]);

  // Build grade-levels set per subject
  const subjectGrades: Record<string, Set<string>> = {};
  for (const ss of (ssRows ?? []) as unknown as SectionSubjectGradeRow[]) {
    const level = String(ss.sections?.grades?.level ?? "");
    if (!level) continue;
    if (!subjectGrades[ss.subject_id]) subjectGrades[ss.subject_id] = new Set();
    subjectGrades[ss.subject_id].add(level);
  }

  const subjects: Subject[] = (subjectRows ?? []).map((s) => ({
    id:            s.id,
    name:          s.name,
    code:          s.code,
    type:          s.type ?? "core",
    status:        s.status ?? "active",
    weeklyPeriods: s.weekly_periods ?? 0,
    teacher:       "",
    classes:       [...(subjectGrades[s.id] ?? [])].sort((a, b) => +a - +b),
  }));

  return <SubjectsClient initialSubjects={subjects} />;
}
