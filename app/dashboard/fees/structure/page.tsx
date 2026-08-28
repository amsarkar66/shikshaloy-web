import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import FeeStructureClient from "../_components/FeeStructureClient";
import type { FeeStructure, GradeOption } from "../_data/fees";

export const dynamic = "force-dynamic";

export default async function FeeStructurePage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: structureRows }, { data: gradeRows }] = await Promise.all([
    supabaseAdmin
      .from("fee_structures")
      .select("id, grade_id, category, amount, frequency, is_optional, is_one_time, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("category"),

    supabaseAdmin
      .from("grades")
      .select("id, level")
      .eq("school_id", schoolId)
      .order("level"),
  ]);

  const grades: GradeOption[] = (gradeRows ?? []).map((g) => ({ id: g.id, level: g.level }));

  const structures: FeeStructure[] = ((structureRows ?? []) as unknown as {
    id: string; grade_id: string | null; category: string; amount: number;
    frequency: string | null; is_optional: boolean | null; is_one_time: boolean | null; grades: { level: number | null } | null;
  }[]).map((s) => ({
    id: s.id,
    gradeId: s.grade_id,
    gradeLevel: s.grades?.level ?? null,
    category: s.category,
    amount: Number(s.amount ?? 0),
    frequency: (s.frequency as FeeStructure["frequency"]) ?? "monthly",
    isOptional: s.is_optional ?? false,
    isOneTime: s.is_one_time ?? false,
  }));

  return <FeeStructureClient structures={structures} grades={grades} backHref="/dashboard/fees" />;
}
