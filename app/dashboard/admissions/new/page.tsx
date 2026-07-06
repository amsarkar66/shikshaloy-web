import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import NewApplicationForm, { type AcademicYearOption } from "../_components/NewApplicationForm";

export default async function NewApplicationPage() {
  const { data: yearRows } = await supabaseAdmin
    .from("academic_years")
    .select("id, name")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("name", { ascending: false });

  const academicYears: AcademicYearOption[] = (yearRows ?? []).map((y: any) => ({ id: y.id, name: y.name }));

  return <NewApplicationForm academicYears={academicYears} />;
}
