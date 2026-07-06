import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import HomeworkClient from "./_components/HomeworkClient";
import type { Homework } from "./_data/homework";

export default async function HomeworkPage() {
  const [{ data: hwRows }, { data: subjectRows }, { data: sectionRows }, { data: teacherRows }, { data: studentRows }] =
    await Promise.all([
      supabaseAdmin
        .from("homework")
        .select(`
          id, title, assigned_date, due_date, description, status, section_id,
          subjects ( name ),
          sections ( name, grades ( level ) ),
          staff_members ( full_name )
        `)
        .eq("school_id", DEMO_SCHOOL_ID)
        .order("due_date"),

      supabaseAdmin.from("subjects").select("id, name").eq("school_id", DEMO_SCHOOL_ID).order("name"),

      supabaseAdmin
        .from("sections")
        .select("id, name, grades ( level )")
        .eq("school_id", DEMO_SCHOOL_ID)
        .eq("academic_year_id", DEMO_AY_ID)
        .order("name"),

      supabaseAdmin
        .from("staff_members")
        .select("id, full_name, designation")
        .eq("school_id", DEMO_SCHOOL_ID)
        .eq("type", "teaching")
        .order("full_name"),

      supabaseAdmin.from("students").select("id, section_id").eq("school_id", DEMO_SCHOOL_ID),
    ]);

  const studentCountBySection: Record<string, number> = {};
  for (const s of (studentRows ?? []) as any[]) {
    studentCountBySection[s.section_id] = (studentCountBySection[s.section_id] ?? 0) + 1;
  }

  const hwIds = (hwRows ?? []).map((h: any) => h.id);
  const { data: subRows } = hwIds.length
    ? await supabaseAdmin.from("homework_submissions").select("homework_id").in("homework_id", hwIds)
    : { data: [] as any[] };

  const submittedCount: Record<string, number> = {};
  for (const s of (subRows ?? []) as any[]) {
    submittedCount[s.homework_id] = (submittedCount[s.homework_id] ?? 0) + 1;
  }

  const homework: Homework[] = ((hwRows ?? []) as any[]).map((h) => ({
    id: h.id,
    title: h.title,
    subject: h.subjects?.name ?? "—",
    sectionLabel: `${h.sections?.grades?.level ?? "?"}-${h.sections?.name ?? ""}`,
    teacher: h.staff_members?.full_name ?? "—",
    assignedDate: h.assigned_date,
    dueDate: h.due_date,
    totalStudents: studentCountBySection[h.section_id] ?? 0,
    submitted: submittedCount[h.id] ?? 0,
    description: h.description ?? "",
    status: h.status,
  }));

  const subjects = ((subjectRows ?? []) as any[]).map((s) => ({ id: s.id, name: s.name }));
  const sections = ((sectionRows ?? []) as any[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = ((teacherRows ?? []) as any[]).map((t) => ({ id: t.id, name: t.full_name, designation: t.designation }));

  return <HomeworkClient homework={homework} subjects={subjects} sections={sections} teachers={teachers} />;
}
