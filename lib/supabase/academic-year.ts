import { cache } from "react";
import { supabaseAdmin } from "./service";
import { getCurrentSchoolIdOrThrow } from "./school-context";

export const getCurrentAcademicYearId = cache(async (): Promise<string> => {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (!data) throw new Error("No current academic year is set up for this school yet.");
  return data.id;
});
