import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import SubjectsClient from "./_components/SubjectsClient";
import type { Subject } from "./_components/SubjectsClient";

interface SectionSubjectGradeRow {
  subject_id: string;
  sections: { grades: { level: number | null } | null } | null;
  profiles: { full_name: string | null } | null;
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
      .select("subject_id, sections ( grades ( level ) ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),
  ]);

  // Build grade-levels set and distinct teacher names per subject
  const subjectGrades: Record<string, Set<string>> = {};
  const subjectTeachers: Record<string, Set<string>> = {};
  for (const ss of (ssRows ?? []) as unknown as SectionSubjectGradeRow[]) {
    const level = String(ss.sections?.grades?.level ?? "");
    if (level) {
      if (!subjectGrades[ss.subject_id]) subjectGrades[ss.subject_id] = new Set();
      subjectGrades[ss.subject_id].add(level);
    }
    const teacherName = ss.profiles?.full_name;
    if (teacherName) {
      if (!subjectTeachers[ss.subject_id]) subjectTeachers[ss.subject_id] = new Set();
      subjectTeachers[ss.subject_id].add(teacherName);
    }
  }

  const subjects: Subject[] = (subjectRows ?? []).map((s) => {
    const teacherNames = [...(subjectTeachers[s.id] ?? [])].sort();
    return {
      id:            s.id,
      name:          s.name,
      code:          s.code,
      type:          s.type ?? "core",
      status:        s.status ?? "active",
      weeklyPeriods: s.weekly_periods ?? 0,
      teacher:       teacherNames.length === 0 ? "" : teacherNames.length === 1 ? teacherNames[0] : "Multiple",
      classes:       [...(subjectGrades[s.id] ?? [])].sort((a, b) => +a - +b),
    };
  });

  return <SubjectsClient initialSubjects={subjects} />;
}
