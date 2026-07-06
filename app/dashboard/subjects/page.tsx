import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import SubjectsClient from "./_components/SubjectsClient";
import type { Subject } from "./_components/SubjectsClient";

export default async function SubjectsPage() {
  const [{ data: subjectRows }, { data: ssRows }] = await Promise.all([
    supabaseAdmin
      .from("subjects")
      .select("id, name, code, type, status, weekly_periods")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("name"),

    supabaseAdmin
      .from("section_subjects")
      .select("subject_id, sections ( grades ( level ) )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID),
  ]);

  // Build grade-levels set per subject
  const subjectGrades: Record<string, Set<string>> = {};
  for (const ss of ssRows ?? []) {
    const level = String((ss as any).sections?.grades?.level ?? "");
    if (!level) continue;
    if (!subjectGrades[ss.subject_id]) subjectGrades[ss.subject_id] = new Set();
    subjectGrades[ss.subject_id].add(level);
  }

  const subjects: Subject[] = (subjectRows ?? []).map((s: any) => ({
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
