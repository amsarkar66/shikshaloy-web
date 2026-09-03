import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import ExamsClient from "./_components/ExamsClient";
import { type Exam } from "./_data/exams";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and institution owners can manage exams.</p>
      </div>
    </div>
  );
}

interface ExamRow {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;
  start_date: string;
  end_date: string;
  school_id: string;
  academic_years: { name: string | null } | null;
}

interface ScheduleRow {
  exam_id: string;
  subjects: { name: string | null } | null;
}

function buildExams(examRows: ExamRow[], scheduleRows: ScheduleRow[], schoolNameById?: Map<string, string>): Exam[] {
  const subjectsByExam: Record<string, Set<string>> = {};
  for (const r of scheduleRows) {
    const name = r.subjects?.name;
    if (!name) continue;
    (subjectsByExam[r.exam_id] ??= new Set()).add(name);
  }

  return examRows.map((e) => ({
    id: e.id,
    name: e.name ?? "",
    type: (e.type ?? "unit_test") as Exam["type"],
    status: (e.status ?? "upcoming") as Exam["status"],
    startDate: e.start_date,
    endDate: e.end_date,
    academicYear: e.academic_years?.name ?? "—",
    subjects: Array.from(subjectsByExam[e.id] ?? []).sort(),
    schoolId: schoolNameById ? e.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(e.school_id) ?? "—") : undefined,
  }));
}

export default async function ExamsPage() {
  const verifiedUser = await getVerifiedUser();
  const role = verifiedUser?.role;
  if (role !== "admin" && role !== "super_admin") return <Unauthorized />;

  if (role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <ExamsClient exams={[]} schools={schools} />;
    }

    const [{ data: examRows }, { data: scheduleRows }] = await Promise.all([
      supabaseAdmin
        .from("exams")
        .select("id, name, type, status, start_date, end_date, school_id, academic_years ( name )")
        .in("school_id", schoolIds)
        .order("start_date"),
      supabaseAdmin
        .from("exam_schedules")
        .select("exam_id, subjects ( name )")
        .in("school_id", schoolIds),
    ]);

    const exams = buildExams(
      (examRows ?? []) as unknown as ExamRow[],
      (scheduleRows ?? []) as unknown as ScheduleRow[],
      schoolNameById
    );

    return <ExamsClient exams={exams} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: examRows }, { data: scheduleRows }] = await Promise.all([
    supabaseAdmin
      .from("exams")
      .select("id, name, type, status, start_date, end_date, school_id, academic_years ( name )")
      .eq("school_id", schoolId)
      .order("start_date"),

    supabaseAdmin
      .from("exam_schedules")
      .select("exam_id, subjects ( name )")
      .eq("school_id", schoolId),
  ]);

  const exams = buildExams((examRows ?? []) as unknown as ExamRow[], (scheduleRows ?? []) as unknown as ScheduleRow[]);

  return <ExamsClient exams={exams} />;
}
