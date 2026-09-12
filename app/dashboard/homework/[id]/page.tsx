import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft, BookOpen, GraduationCap, CalendarDays, Clock,
  ClipboardList, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { getVerifiedUser, isAdmin } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getTeacherContext } from "@/lib/teachers/context";
import { formatDate, isOverdue, submissionRate, type Homework } from "../_data/homework";
import { SubmissionRoster, type RosterItem } from "../_components/SubmissionRoster";
import { HomeworkDetailActions } from "../_components/HomeworkDetailActions";

interface HomeworkRow {
  id: string;
  title: string | null;
  assigned_date: string;
  due_date: string;
  description: string | null;
  status: string;
  subject_id: string;
  section_id: string;
  teacher_id: string;
  subjects: { name: string | null } | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface OptionSubjectRow {
  id: string;
  name: string | null;
}

interface OptionSectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
}

interface OptionTeacherRow {
  id: string;
  full_name: string | null;
  designation: string | null;
}

interface StudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  photo_url: string | null;
  phone: string | null;
}

interface SubmissionRow {
  student_id: string;
  submitted_at: string;
}

export default async function HomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getVerifiedUser();
  if (!user) notFound();

  const role = user.role;
  if (role === "student") redirect("/dashboard/homework");
  const userIsAdmin = await isAdmin(user);
  if (role !== "admin" && role !== "super_admin" && role !== "teacher" && !userIsAdmin) redirect("/dashboard");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: hwRow } = await supabaseAdmin
    .from("homework")
    .select(`
      id, title, assigned_date, due_date, description, status, subject_id, section_id, teacher_id,
      subjects ( name ),
      sections ( name, grades ( level ) ),
      staff_members ( full_name )
    `)
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!hwRow) notFound();
  const hw = hwRow as unknown as HomeworkRow;

  let canEdit = role === "admin" || role === "super_admin" || userIsAdmin;
  let subjectOptions: { id: string; name: string }[] = [];
  let sectionOptions: { id: string; label: string }[] = [];
  let teacherOptions: { id: string; name: string; designation: string }[] = [];

  // Skip the ownership check entirely for an admin-grant-holding teacher —
  // without this, they'd hit notFound() below for any homework they didn't
  // personally assign, despite canEdit already being (correctly) true.
  if (role === "teacher" && !userIsAdmin) {
    const teacher = await getTeacherContext(user.id);
    if (!teacher || teacher.staffId !== hw.teacher_id) notFound();
    canEdit = true;

    const sectionIds = teacher.sectionIds;
    const subjectIds = Array.from(new Set(teacher.subjectAssignments.map((a) => a.subjectId)));
    const [{ data: subjectRows }, { data: sectionRows }] = await Promise.all([
      subjectIds.length
        ? supabaseAdmin.from("subjects").select("id, name").in("id", subjectIds).order("name")
        : Promise.resolve({ data: [] as OptionSubjectRow[] }),
      sectionIds.length
        ? supabaseAdmin.from("sections").select("id, name, grades ( level )").in("id", sectionIds).order("name")
        : Promise.resolve({ data: [] as OptionSectionRow[] }),
    ]);
    subjectOptions = ((subjectRows ?? []) as unknown as OptionSubjectRow[]).map((s) => ({ id: s.id, name: s.name ?? "" }));
    sectionOptions = ((sectionRows ?? []) as unknown as OptionSectionRow[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
    teacherOptions = [{ id: teacher.staffId, name: teacher.fullName, designation: teacher.designation }];
  } else if (canEdit) {
    const academicYearId = await getCurrentAcademicYearId();
    const [{ data: subjectRows }, { data: sectionRows }, { data: teacherRows }] = await Promise.all([
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
    ]);
    subjectOptions = ((subjectRows ?? []) as unknown as OptionSubjectRow[]).map((s) => ({ id: s.id, name: s.name ?? "" }));
    sectionOptions = ((sectionRows ?? []) as unknown as OptionSectionRow[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
    teacherOptions = ((teacherRows ?? []) as unknown as OptionTeacherRow[]).map((t) => ({ id: t.id, name: t.full_name ?? "", designation: t.designation ?? "" }));
  }

  const [{ data: studentRows }, { data: subRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, photo_url, phone")
      .eq("school_id", schoolId)
      .eq("section_id", hw.section_id)
      .order("roll_no"),

    supabaseAdmin.from("homework_submissions").select("student_id, submitted_at").eq("homework_id", id),
  ]);

  const students = (studentRows ?? []) as unknown as StudentRow[];
  const submittedByStudent: Record<string, string> = {};
  for (const s of (subRows ?? []) as unknown as SubmissionRow[]) {
    submittedByStudent[s.student_id] = s.submitted_at;
  }

  const roster: RosterItem[] = students.map((s) => ({
    studentId: s.id,
    fullName: s.full_name,
    rollNo: s.roll_no,
    photoUrl: s.photo_url,
    phone: s.phone,
    submitted: s.id in submittedByStudent,
    submittedAt: submittedByStudent[s.id] ?? null,
  }));

  const homework: Homework = {
    id: hw.id,
    title: hw.title ?? "",
    subject: hw.subjects?.name ?? "—",
    subjectId: hw.subject_id,
    sectionLabel: `${hw.sections?.grades?.level ?? "?"}-${hw.sections?.name ?? ""}`,
    sectionId: hw.section_id,
    teacher: hw.staff_members?.full_name ?? "—",
    teacherId: hw.teacher_id,
    assignedDate: hw.assigned_date,
    dueDate: hw.due_date,
    totalStudents: students.length,
    submitted: roster.filter((r) => r.submitted).length,
    description: hw.description ?? "",
    status: hw.status as Homework["status"],
  };

  const rate = submissionRate(homework);
  const overdue = isOverdue(homework);
  const pending = homework.totalStudents - homework.submitted;

  const stats = [
    { label: "Total Students", value: String(homework.totalStudents), icon: ClipboardList, accent: "text-indigo-500 bg-indigo-500/10" },
    { label: "Submitted", value: String(homework.submitted), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Pending", value: String(pending), icon: Clock, accent: "text-amber-500 bg-amber-500/10" },
    { label: "Submission Rate", value: `${rate}%`, icon: AlertTriangle, accent: "text-blue-500 bg-blue-500/10" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/homework"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Homework
        </Link>
        {canEdit && (
          <HomeworkDetailActions
            homework={homework}
            subjects={subjectOptions}
            sections={sectionOptions}
            teachers={teacherOptions}
          />
        )}
      </div>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 dark:bg-primary-500/20">
              <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{homework.title}</h1>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  homework.status === "closed"
                    ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }`}>
                  {homework.status === "closed" ? "Closed" : "Active"}
                </span>
                {overdue && (
                  <span className="text-[10px] font-semibold uppercase text-red-500">overdue</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-400">
                <span>{homework.subject} · Class {homework.sectionLabel}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{homework.teacher}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto shrink-0 text-xs text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Assigned {formatDate(homework.assignedDate)}</span>
            <span>·</span>
            <span className={`flex items-center gap-1 ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : ""}`}>
              <Clock className="h-3.5 w-3.5" />Due {formatDate(homework.dueDate)}
            </span>
          </div>
        </div>

        {homework.description && (
          <p className="mt-4 rounded-lg bg-gray-50 dark:bg-zinc-800 p-3 text-sm text-gray-600 dark:text-zinc-300">
            {homework.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Roster */}
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-3">
          Students ({homework.totalStudents})
        </p>
        <SubmissionRoster homeworkId={homework.id} items={roster} canEdit={canEdit} locked={homework.status === "closed"} />
      </div>
    </div>
  );
}
