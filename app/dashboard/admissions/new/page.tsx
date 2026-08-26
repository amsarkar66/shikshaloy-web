import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import NewApplicationForm, { type AcademicYearOption, type GradeOption } from "../_components/NewApplicationForm";

export default async function NewApplicationPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data: yearRows }, { data: gradeRows }] = await Promise.all([
    supabaseAdmin
      .from("academic_years")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: false }),
    supabaseAdmin
      .from("grades")
      .select("id, name, level")
      .eq("school_id", schoolId)
      .order("level"),
  ]);

  const academicYears: AcademicYearOption[] = (yearRows ?? []).map((y) => ({ id: y.id, name: y.name }));
  const grades: GradeOption[] = (gradeRows ?? []).map((g) => ({ id: g.id, name: g.name }));

  return <NewApplicationForm academicYears={academicYears} grades={grades} />;
}
