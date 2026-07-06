import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import AnalyticsClient from "./_components/AnalyticsClient";
import { GRADE_COLOR } from "./_data/analytics";
import type { FeeMonth, ClassAttendance, SubjectPerf, GradeSlice } from "./_data/analytics";

export default async function AnalyticsPage() {
  const [
    { data: ayRow },
    { data: studentRows },
    { data: feeRows },
    { data: examRows },
  ] = await Promise.all([
    supabaseAdmin.from("academic_years").select("name").eq("id", DEMO_AY_ID).single(),

    supabaseAdmin
      .from("students")
      .select("id, attendance_pct, sections ( name, grades ( level ) )")
      .eq("school_id", DEMO_SCHOOL_ID),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str, amount_due, amount_paid")
      .eq("school_id", DEMO_SCHOOL_ID),

    supabaseAdmin
      .from("exam_results")
      .select("marks_obtained, max_marks, grade, is_absent, subjects ( name )")
      .eq("school_id", DEMO_SCHOOL_ID),
  ]);

  const students = (studentRows ?? []) as any[];
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
  for (const f of (feeRows ?? []) as any[]) {
    (byMonth[f.month_str] ??= { due: 0, paid: 0 });
    byMonth[f.month_str].due += Number(f.amount_due ?? 0);
    byMonth[f.month_str].paid += Number(f.amount_paid ?? 0);
  }
  const feeMonths: FeeMonth[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { due, paid }]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short" }),
      collected: Math.round((paid / 100000) * 100) / 100,
      due: Math.round((due / 100000) * 100) / 100,
    }));
  const totalDue = Object.values(byMonth).reduce((s, m) => s + m.due, 0);
  const totalPaid = Object.values(byMonth).reduce((s, m) => s + m.paid, 0);
  const feeCollectionRate = totalDue ? Math.round((totalPaid / totalDue) * 100) : 0;

  // Exam results: subject performance + grade distribution + overall pass rate
  const results = (examRows ?? []) as any[];
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
    />
  );
}
