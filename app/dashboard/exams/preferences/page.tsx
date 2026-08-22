import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import ExamPreferenceClient, { type PreferenceSectionOption } from "../_components/ExamPreferenceClient";

export default async function ExamPreferencePage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: sectionRows } = await supabaseAdmin
    .from("sections")
    .select("id, name, grades ( level )")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  const sections: PreferenceSectionOption[] = (sectionRows ?? [])
    .map((s) => {
      const grades = s.grades as unknown as { level: number | null } | { level: number | null }[] | null;
      const level = Array.isArray(grades) ? grades[0]?.level : grades?.level;
      return { id: s.id, label: `Class ${level ?? "?"}-${s.name ?? ""}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return <ExamPreferenceClient sections={sections} />;
}
