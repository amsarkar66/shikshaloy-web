import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow, getSchoolPickerData } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import AnalyticsClient from "./_components/AnalyticsClient";
import { GRADE_COLOR } from "./_data/analytics";
import type { FeeMonth, ClassAttendance, SubjectPerf, GradeSlice } from "./_data/analytics";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and institution owners can view analytics.</p>
      </div>
    </div>
  );
}

interface StudentAttendanceRow {
  id: string;
  attendance_pct: number | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface ExamResultRow {
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
}

export default async function AnalyticsPage() {
  const vu = await getVerifiedUser();
  const role = vu?.role;
  if (!vu || (role !== "admin" && role !== "super_admin")) return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();
  const { schools, activeSchoolId } = await getSchoolPickerData();

  const [
    { data: ayRow },
    { data: studentRows },
    { data: feeRows },
    { data: examRows },
  ] = await Promise.all([
    supabaseAdmin.from("academic_years").select("name").eq("id", academicYearId).single(),

    supabaseAdmin
      .from("students")
      .select("id, attendance_pct, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str, amount_due, amount_paid")
      .eq("school_id", schoolId),

    supabaseAdmin
      .from("exam_results")
      .select("marks_obtained, max_marks, grade, is_absent, subjects ( name )")
      .eq("school_id", schoolId),
  ]);

  const students = (studentRows ?? []) as unknown as StudentAttendanceRow[];
  const totalStudents = students.length;
  const avgAttendance = totalStudents
    ? students.reduce((s, x) => s + Number(x.attendance_pct ?? 0), 0) / totalStudents
    : 0;

  // Class-wise attendance
  const bySection: Record<string, { sum: number; count: number }> = {};
  for (const s of students) {
    const label = `Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`;
    (bySection[label] ??= { sum: 0, count: 0 });
    bySection[label].sum += Number(s.attendance_pct ?? 0);
    bySection[label].count += 1;
  }
  const classAttendance: ClassAttendance[] = Object.entries(bySection)
    .map(([label, { sum, count }]) => ({ label, value: Math.round((sum / count) * 10) / 10, students: count }))
    .sort((a, b) => b.value - a.value);

  // Fee collection by month
  const byMonth: Record<string, { due: number; paid: number }> = {};
  for (const f of feeRows ?? []) {
    (byMonth[f.month_str] ??= { due: 0, paid: 0 });
    byMonth[f.month_str].due += Number(f.amount_due ?? 0);
    byMonth[f.month_str].paid += Number(f.amount_paid ?? 0);
  }
  // Fixed last-12-months window (ending this month) so the chart always shows
  // 12 bars, with zero bars for months that have no fee_payments rows yet.
  const now = new Date();
  const last12MonthKeys = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const feeMonths: FeeMonth[] = last12MonthKeys.map((month) => {
    const agg = byMonth[month] ?? { due: 0, paid: 0 };
    return {
      month: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short" }),
      collected: Math.round((agg.paid / 100000) * 100) / 100,
      due: Math.round((agg.due / 100000) * 100) / 100,
    };
  });
  const totalDue = Object.values(byMonth).reduce((s, m) => s + m.due, 0);
  const totalPaid = Object.values(byMonth).reduce((s, m) => s + m.paid, 0);
  const feeCollectionRate = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  // Exam results: subject performance + grade distribution + overall pass rate
  const results = (examRows ?? []) as unknown as ExamResultRow[];
  const attempted = results.filter((r) => !r.is_absent);
  const passed = attempted.filter((r) => Number(r.marks_obtained) >= Number(r.max_marks) * 0.33);
  const overallPassRate = attempted.length ? Math.round((passed.length / attempted.length) * 100) : 0;

  const bySubject: Record<string, { attempted: number; passed: number; pctSum: number }> = {};
  for (const r of attempted) {
    const name = r.subjects?.name ?? "—";
    (bySubject[name] ??= { attempted: 0, passed: 0, pctSum: 0 });
    bySubject[name].attempted += 1;
    if (Number(r.marks_obtained) >= Number(r.max_marks) * 0.33) bySubject[name].passed += 1;
    bySubject[name].pctSum += (Number(r.marks_obtained) / Number(r.max_marks)) * 100;
  }
  const subjectPerf: SubjectPerf[] = Object.entries(bySubject)
    .map(([subject, { attempted, passed, pctSum }]) => ({
      subject,
      passRate: Math.round((passed / attempted) * 100),
      avg: Math.round(pctSum / attempted),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));

  const gradeCounts: Record<string, number> = {};
  for (const r of attempted) {
    gradeCounts[r.grade] = (gradeCounts[r.grade] ?? 0) + 1;
  }
  const gradeTotal = attempted.length;
  const gradeOrder = ["A+", "A", "B+", "B", "C", "D", "F"];
  const gradeDist: GradeSlice[] = gradeOrder
    .filter((g) => gradeCounts[g])
    .map((grade) => ({
      grade,
      pct: gradeTotal ? Math.round((gradeCounts[grade] / gradeTotal) * 100) : 0,
      color: GRADE_COLOR[grade] ?? "#a1a1aa",
    }));

  return (
    <AnalyticsClient
      academicYear={ayRow?.name ?? "Current Year"}
      kpi={{
        totalStudents,
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        feeCollectionRate,
        overallPassRate,
      }}
      feeMonths={feeMonths}
      classAttendance={classAttendance}
      gradeDist={gradeDist}
      subjectPerf={subjectPerf}
      schools={schools}
      activeSchoolId={activeSchoolId}
    />
  );
}
