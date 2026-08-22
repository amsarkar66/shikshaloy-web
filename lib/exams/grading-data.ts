import { supabaseAdmin } from "@/lib/supabase/service";
import { DEFAULT_GRADE_BANDS, type GradeBand } from "./grading";

/** A school's configured grade bands, or the built-in default if it hasn't set any. */
export async function getSchoolGradeBands(schoolId: string): Promise<GradeBand[]> {
  const { data } = await supabaseAdmin
    .from("grade_bands")
    .select("id, label, min_percent")
    .eq("school_id", schoolId)
    .order("min_percent", { ascending: false });

  if (!data || data.length === 0) return DEFAULT_GRADE_BANDS;
  return data.map((b) => ({ id: b.id, label: b.label, minPercent: Number(b.min_percent) }));
}

/** A school's configured passing percentage (defaults to 35 if unset). */
export async function getSchoolPassMarks(schoolId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("school_academic_settings")
    .select("pass_marks")
    .eq("school_id", schoolId)
    .maybeSingle();

  return data?.pass_marks ?? 35;
}
