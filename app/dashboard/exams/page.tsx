import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
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
  academic_years: { name: string | null } | null;
}

interface ScheduleRow {
  exam_id: string;
  subjects: { name: string | null } | null;
}

export default async function ExamsPage() {
  const role = await getVerifiedRole();
  if (role !== "admin" && role !== "super_admin") return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: examRows }, { data: scheduleRows }] = await Promise.all([
    supabaseAdmin
      .from("exams")
      .select("id, name, type, status, start_date, end_date, academic_years ( name )")
      .eq("school_id", schoolId)
      .order("start_date"),

    supabaseAdmin
      .from("exam_schedules")
      .select("exam_id, subjects ( name )")
      .eq("school_id", schoolId),
  ]);

  const examIds = ((examRows ?? []) as unknown as ExamRow[]).map((e) => e.id);

  const subjectsByExam: Record<string, Set<string>> = {};
  for (const r of ((scheduleRows ?? []) as unknown as ScheduleRow[])) {
    const name = r.subjects?.name;
    if (!name) continue;
    (subjectsByExam[r.exam_id] ??= new Set()).add(name);
  }

  const exams: Exam[] = ((examRows ?? []) as unknown as ExamRow[])
    .filter((e) => examIds.includes(e.id))
    .map((e) => ({
      id: e.id,
      name: e.name ?? "",
      type: (e.type ?? "unit_test") as Exam["type"],
      status: (e.status ?? "upcoming") as Exam["status"],
      startDate: e.start_date,
      endDate: e.end_date,
      academicYear: e.academic_years?.name ?? "—",
      subjects: Array.from(subjectsByExam[e.id] ?? []).sort(),
    }));

  return <ExamsClient exams={exams} />;
}
