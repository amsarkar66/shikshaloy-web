import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";
import HomeworkClient from "./_components/HomeworkClient";
import { StudentHomeworkList, type StudentHomeworkItem } from "./_components/StudentHomeworkList";
import type { Homework } from "./_data/homework";

interface StudentHomeworkRow {
  id: string;
  title: string | null;
  due_date: string;
  description: string | null;
  subjects: { name: string | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface SubmissionRow {
  homework_id: string;
}

interface AdminHomeworkRow {
  id: string;
  title: string | null;
  assigned_date: string;
  due_date: string;
  description: string | null;
  status: string;
  section_id: string;
  subjects: { name: string | null } | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface StudentSectionRow {
  id: string;
  section_id: string | null;
}

interface HomeworkSubjectRow {
  id: string;
  name: string | null;
}

interface HomeworkSectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
}

interface HomeworkTeacherRow {
  id: string;
  full_name: string | null;
  designation: string | null;
}

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

  const submittedIds = new Set(((subRows ?? []) as unknown as SubmissionRow[]).map((s) => s.homework_id));

  const items: StudentHomeworkItem[] = ((hwRows ?? []) as unknown as StudentHomeworkRow[]).map((h) => ({
    id: h.id,
    title: h.title ?? "",
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

async function TeacherHomework({ userId }: { userId: string }) {
  const teacher = await getTeacherContext(userId);

  if (!teacher) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No classes assigned yet</p>
        </div>
      </div>
    );
  }

  const sectionIds = teacher.sectionIds;
  const subjectIds = Array.from(new Set(teacher.subjectAssignments.map((a) => a.subjectId)));

  const [{ data: hwRows }, { data: subjectRows }, { data: sectionRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("homework")
      .select(`
        id, title, assigned_date, due_date, description, status, section_id,
        subjects ( name ),
        sections ( name, grades ( level ) ),
        staff_members ( full_name )
      `)
      .eq("teacher_id", teacher.staffId)
      .order("due_date"),

    subjectIds.length
      ? supabaseAdmin.from("subjects").select("id, name").in("id", subjectIds).order("name")
      : Promise.resolve({ data: [] as HomeworkSubjectRow[] }),

    sectionIds.length
      ? supabaseAdmin.from("sections").select("id, name, grades ( level )").in("id", sectionIds).order("name")
      : Promise.resolve({ data: [] as HomeworkSectionRow[] }),

    sectionIds.length
      ? supabaseAdmin.from("students").select("id, section_id").in("section_id", sectionIds)
      : Promise.resolve({ data: [] as StudentSectionRow[] }),
  ]);

  const studentCountBySection: Record<string, number> = {};
  for (const s of (studentRows ?? []) as unknown as StudentSectionRow[]) {
    if (s.section_id) studentCountBySection[s.section_id] = (studentCountBySection[s.section_id] ?? 0) + 1;
  }

  const hwIds = ((hwRows ?? []) as unknown as AdminHomeworkRow[]).map((h) => h.id);
  const { data: subRows } = hwIds.length
    ? await supabaseAdmin.from("homework_submissions").select("homework_id").in("homework_id", hwIds)
    : { data: [] as SubmissionRow[] };

  const submittedCount: Record<string, number> = {};
  for (const s of (subRows ?? []) as unknown as SubmissionRow[]) {
    submittedCount[s.homework_id] = (submittedCount[s.homework_id] ?? 0) + 1;
  }

  const homework: Homework[] = ((hwRows ?? []) as unknown as AdminHomeworkRow[]).map((h) => ({
    id: h.id,
    title: h.title ?? "",
    subject: h.subjects?.name ?? "—",
    sectionLabel: `${h.sections?.grades?.level ?? "?"}-${h.sections?.name ?? ""}`,
    teacher: h.staff_members?.full_name ?? "—",
    assignedDate: h.assigned_date,
    dueDate: h.due_date,
    totalStudents: studentCountBySection[h.section_id] ?? 0,
    submitted: submittedCount[h.id] ?? 0,
    description: h.description ?? "",
    status: h.status as Homework["status"],
  }));

  const subjects = ((subjectRows ?? []) as unknown as HomeworkSubjectRow[]).map((s) => ({ id: s.id, name: s.name ?? "" }));
  const sections = ((sectionRows ?? []) as unknown as HomeworkSectionRow[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = [{ id: teacher.staffId, name: teacher.fullName, designation: teacher.designation }];

  return <HomeworkClient homework={homework} subjects={subjects} sections={sections} teachers={teachers} />;
}

export default async function HomeworkPage() {
  const verifiedUser = await getVerifiedUser();
  const role = verifiedUser?.role;

  if (role === "student" && verifiedUser) {
    return <StudentHomework userId={verifiedUser.id} />;
  }

  if (role === "teacher" && verifiedUser) {
    return <TeacherHomework userId={verifiedUser.id} />;
  }

  if (!verifiedUser || role !== "admin") {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to homework management.</p>
        </div>
      </div>
    );
  }

  const academicYearId = await getCurrentAcademicYearId();
  const schoolId = await getCurrentSchoolIdOrThrow();

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
        .eq("school_id", schoolId)
        .order("due_date"),

      supabaseAdmin.from("subjects").select("id, name").eq("school_id", schoolId).order("name"),

      supabaseAdmin
        .from("sections")
        .select("id, name, grades ( level )")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .order("name"),

      supabaseAdmin
        .from("staff_members")
        .select("id, full_name, designation")
        .eq("school_id", schoolId)
        .eq("type", "teaching")
        .order("full_name"),

      supabaseAdmin.from("students").select("id, section_id").eq("school_id", schoolId),
    ]);

  const studentCountBySection: Record<string, number> = {};
  for (const s of (studentRows ?? []) as unknown as StudentSectionRow[]) {
    if (s.section_id) studentCountBySection[s.section_id] = (studentCountBySection[s.section_id] ?? 0) + 1;
  }

  const hwIds = ((hwRows ?? []) as unknown as AdminHomeworkRow[]).map((h) => h.id);
  const { data: subRows } = hwIds.length
    ? await supabaseAdmin.from("homework_submissions").select("homework_id").in("homework_id", hwIds)
    : { data: [] as SubmissionRow[] };

  const submittedCount: Record<string, number> = {};
  for (const s of (subRows ?? []) as unknown as SubmissionRow[]) {
    submittedCount[s.homework_id] = (submittedCount[s.homework_id] ?? 0) + 1;
  }

  const homework: Homework[] = ((hwRows ?? []) as unknown as AdminHomeworkRow[]).map((h) => ({
    id: h.id,
    title: h.title ?? "",
    subject: h.subjects?.name ?? "—",
    sectionLabel: `${h.sections?.grades?.level ?? "?"}-${h.sections?.name ?? ""}`,
    teacher: h.staff_members?.full_name ?? "—",
    assignedDate: h.assigned_date,
    dueDate: h.due_date,
    totalStudents: studentCountBySection[h.section_id] ?? 0,
    submitted: submittedCount[h.id] ?? 0,
    description: h.description ?? "",
    status: h.status as Homework["status"],
  }));

  const subjects = ((subjectRows ?? []) as unknown as HomeworkSubjectRow[]).map((s) => ({ id: s.id, name: s.name ?? "" }));
  const sections = ((sectionRows ?? []) as unknown as HomeworkSectionRow[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = ((teacherRows ?? []) as unknown as HomeworkTeacherRow[]).map((t) => ({ id: t.id, name: t.full_name ?? "", designation: t.designation ?? "" }));

  return <HomeworkClient homework={homework} subjects={subjects} sections={sections} teachers={teachers} />;
}
