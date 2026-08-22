import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";
import ClassesClient from "./_components/ClassesClient";
import type { ClassSection } from "./_components/ClassesClient";
import { BookOpen, Users, Landmark } from "lucide-react";

interface SectionSubjectRow {
  subjects: { name: string | null; code: string | null; type: string | null } | null;
  profiles: { full_name: string | null } | null;
}

interface SectionDetailRow {
  room: string | null;
  capacity: number | null;
  profiles: { full_name: string | null } | null;
}

interface SectionListRow {
  id: string;
  name: string | null;
  room: string | null;
  capacity: number | null;
  avg_attendance: number | null;
  status: string | null;
  class_teacher_id: string | null;
  stream_id: string | null;
  grades: { level: number | null } | null;
  profiles: { full_name: string | null } | null;
  streams: { name: string | null } | null;
}

async function StudentClasses({ userId }: { userId: string }) {
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

  const [{ data: sectionRow }, { data: subjectRows }, { count: classmateCount }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("room, capacity, profiles ( full_name )")
      .eq("id", student.sectionId)
      .maybeSingle(),

    supabaseAdmin
      .from("section_subjects")
      .select("subjects ( name, code, type ), profiles ( full_name )")
      .eq("section_id", student.sectionId)
      .eq("academic_year_id", student.academicYearId ?? ""),

    supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("section_id", student.sectionId),
  ]);

  const subjects = ((subjectRows ?? []) as unknown as SectionSubjectRow[]).map((s) => ({
    name: s.subjects?.name ?? "Subject",
    code: s.subjects?.code ?? "",
    type: s.subjects?.type ?? "core",
    teacher: s.profiles?.full_name ?? "—",
  }));

  const section = sectionRow as unknown as SectionDetailRow | null;

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Class</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Class {student.gradeLevel}-{student.sectionName} · Roll No {student.rollNo}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-indigo-500 bg-indigo-500/10"><Landmark className="h-5 w-5" /></div>
          <div><p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{section?.profiles?.full_name ?? "—"}</p><p className="text-xs text-gray-500 dark:text-zinc-400">Class Teacher</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-500 bg-emerald-500/10"><Users className="h-5 w-5" /></div>
          <div><p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{classmateCount ?? 0} students</p><p className="text-xs text-gray-500 dark:text-zinc-400">Room {section?.room ?? "—"}</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-500 bg-violet-500/10"><BookOpen className="h-5 w-5" /></div>
          <div><p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{subjects.length} subjects</p><p className="text-xs text-gray-500 dark:text-zinc-400">This year</p></div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Subjects & Teachers</p>
        </div>
        {subjects.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-zinc-500">No subjects assigned yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{s.type}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">{s.teacher}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function TeacherClasses({ userId }: { userId: string }) {
  const teacher = await getTeacherContext(userId);

  if (!teacher || teacher.sectionIds.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No classes assigned yet</p>
        </div>
      </div>
    );
  }

  const [{ data: sectionRows }, { data: ssRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, class_teacher_id, stream_id, grades ( level ), profiles ( full_name ), streams ( name )")
      .in("id", teacher.sectionIds)
      .order("name"),

    supabaseAdmin
      .from("section_subjects")
      .select("section_id")
      .in("section_id", teacher.sectionIds)
      .eq("academic_year_id", await getCurrentAcademicYearId()),

    supabaseAdmin
      .from("students")
      .select("id, section_id")
      .in("section_id", teacher.sectionIds),
  ]);

  const subjectCount: Record<string, number> = {};
  for (const ss of ssRows ?? []) {
    subjectCount[ss.section_id] = (subjectCount[ss.section_id] ?? 0) + 1;
  }

  const enrolledCount: Record<string, number> = {};
  for (const st of studentRows ?? []) {
    if (st.section_id) enrolledCount[st.section_id] = (enrolledCount[st.section_id] ?? 0) + 1;
  }

  const sections: ClassSection[] = ((sectionRows ?? []) as unknown as SectionListRow[]).map((s) => ({
    id:            s.id,
    classNum:      String(s.grades?.level ?? "?"),
    section:       s.name ?? "",
    teacher:       s.profiles?.full_name ?? "",
    classTeacherId: s.class_teacher_id ?? null,
    stream:        s.streams?.name ?? "",
    streamId:      s.stream_id ?? null,
    room:          s.room ?? "",
    capacity:      s.capacity ?? 40,
    enrolled:      enrolledCount[s.id] ?? 0,
    avgAttendance: Math.round(Number(s.avg_attendance ?? 0)),
    subjectCount:  subjectCount[s.id] ?? 0,
    status:        (s.status ?? "active") as ClassSection["status"],
  })).sort((a, b) => +a.classNum - +b.classNum || a.section.localeCompare(b.section));

  return <ClassesClient initialSections={sections} canManage={false} />;
}

export default async function ClassesPage() {
  const { data: { user } } = await getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (role === "student" && user) {
    return <StudentClasses userId={user.id} />;
  }

  if (role === "teacher" && user) {
    return <TeacherClasses userId={user.id} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: sectionRows }, { data: ssRows }, { data: studentRows }, { data: teacherRows }, { data: streamRows }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, class_teacher_id, stream_id, grades ( level ), profiles ( full_name ), streams ( name )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),

    supabaseAdmin
      .from("section_subjects")
      .select("section_id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),

    supabaseAdmin
      .from("students")
      .select("id, section_id")
      .eq("school_id", schoolId),

    supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("status", "active")
      .order("full_name"),

    supabaseAdmin
      .from("streams")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name"),
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

  const sections: ClassSection[] = ((sectionRows ?? []) as unknown as SectionListRow[]).map((s) => ({
    id:            s.id,
    classNum:      String(s.grades?.level ?? "?"),
    section:       s.name ?? "",
    teacher:       s.profiles?.full_name ?? "",
    classTeacherId: s.class_teacher_id ?? null,
    stream:        s.streams?.name ?? "",
    streamId:      s.stream_id ?? null,
    room:          s.room ?? "",
    capacity:      s.capacity ?? 40,
    enrolled:      enrolledCount[s.id] ?? 0,
    avgAttendance: Math.round(Number(s.avg_attendance ?? 0)),
    subjectCount:  subjectCount[s.id] ?? 0,
    status:        (s.status ?? "active") as ClassSection["status"],
  }));

  const teachers = (teacherRows ?? []).map((t) => ({ id: t.id, name: t.full_name ?? "Unnamed teacher" }));
  const streams = (streamRows ?? []).map((s) => ({ id: s.id, name: s.name }));

  return <ClassesClient initialSections={sections} teachers={teachers} streams={streams} />;
}
