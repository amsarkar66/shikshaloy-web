import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import { getStudentContext } from "@/lib/students/context";
import HomeworkClient from "./_components/HomeworkClient";
import { StudentHomeworkList, type StudentHomeworkItem } from "./_components/StudentHomeworkList";
import type { Homework } from "./_data/homework";

async function StudentHomework({ userId }: { userId: string }) {
  const student = await getStudentContext(userId);

  if (!student || !student.sectionId) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No class assigned yet</p>
        </div>
      </div>
    );
  }

  const [{ data: hwRows }, { data: subRows }] = await Promise.all([
    supabaseAdmin
      .from("homework")
      .select("id, title, due_date, description, subjects ( name ), staff_members ( full_name )")
      .eq("section_id", student.sectionId)
      .eq("status", "active")
      .order("due_date"),

    supabaseAdmin.from("homework_submissions").select("homework_id").eq("student_id", student.id),
  ]);

  const submittedIds = new Set(((subRows ?? []) as any[]).map((s) => s.homework_id));

  const items: StudentHomeworkItem[] = ((hwRows ?? []) as any[]).map((h) => ({
    id: h.id,
    title: h.title,
    subject: h.subjects?.name ?? "Subject",
    teacher: h.staff_members?.full_name ?? "—",
    dueDate: h.due_date,
    description: h.description ?? "",
    submitted: submittedIds.has(h.id),
  }));

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Homework</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Class {student.gradeLevel}-{student.sectionName} · Roll No {student.rollNo}
        </p>
      </div>
      <StudentHomeworkList items={items} studentId={student.id} />
    </div>
  );
}

export default async function HomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (role === "student" && user) {
    return <StudentHomework userId={user.id} />;
  }

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
