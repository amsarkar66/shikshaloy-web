import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import ClassesClient from "./_components/ClassesClient";
import type { ClassSection } from "./_components/ClassesClient";

export default async function ClassesPage() {
  const [{ data: sectionRows }, { data: ssRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, grades ( level ), profiles ( full_name )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID)
      .order("name"),

    supabaseAdmin
      .from("section_subjects")
      .select("section_id")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID),

    supabaseAdmin
      .from("students")
      .select("id, section_id")
      .eq("school_id", DEMO_SCHOOL_ID),
  ]);

  // Build lookup maps
  const subjectCount: Record<string, number> = {};
  for (const ss of ssRows ?? []) {
    subjectCount[ss.section_id] = (subjectCount[ss.section_id] ?? 0) + 1;
  }

  const enrolledCount: Record<string, number> = {};
  for (const st of studentRows ?? []) {
    if (st.section_id) enrolledCount[st.section_id] = (enrolledCount[st.section_id] ?? 0) + 1;
  }

  const sections: ClassSection[] = (sectionRows ?? []).map((s: any) => ({
    id:            s.id,
    classNum:      String(s.grades?.level ?? "?"),
    section:       s.name ?? "",
    teacher:       s.profiles?.full_name ?? "",
    room:          s.room ?? "",
    capacity:      s.capacity ?? 40,
    enrolled:      enrolledCount[s.id] ?? 0,
    avgAttendance: Math.round(Number(s.avg_attendance ?? 0)),
    subjectCount:  subjectCount[s.id] ?? 0,
    status:        (s.status ?? "active") as ClassSection["status"],
  }));

  return <ClassesClient initialSections={sections} />;
}
