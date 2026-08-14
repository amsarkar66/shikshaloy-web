import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import NewApplicationForm, { type AcademicYearOption } from "../_components/NewApplicationForm";

export default async function NewApplicationPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: yearRows } = await supabaseAdmin
    .from("academic_years")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("name", { ascending: false });

  const academicYears: AcademicYearOption[] = (yearRows ?? []).map((y) => ({ id: y.id, name: y.name }));

  return <NewApplicationForm academicYears={academicYears} />;
}
