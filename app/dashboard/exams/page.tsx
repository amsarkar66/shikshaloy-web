import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import ExamsClient from "./_components/ExamsClient";
import {
  getGrade, PASS_MARKS,
  type Exam, type StudentExamResult, type SectionExamStats,
} from "./_data/exams";

export default async function ExamsPage() {
  const [{ data: examRows }, { data: sectionRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("exams")
      .select("id, name, type, status, start_date, end_date, academic_years ( name )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("start_date"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level ), profiles ( full_name )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID),

    supabaseAdmin
      .from("students")
      .select("id, section_id")
      .eq("school_id", DEMO_SCHOOL_ID),
  ]);

  const examIds = (examRows ?? []).map((e: any) => e.id);

  const { data: resultRows } = examIds.length
    ? await supabaseAdmin
        .from("exam_results")
        .select(`
          exam_id, student_id, subject_id, marks_obtained, max_marks, grade, is_absent,
          subjects ( name ),
          students ( full_name, roll_no, attendance_pct, section_id )
        `)
        .eq("school_id", DEMO_SCHOOL_ID)
        .in("exam_id", examIds)
    : { data: [] as any[] };

  // ── Section lookups ─────────────────────────────────────────────────────────
  const sectionLabel: Record<string, string> = {};
  const sectionTeacher: Record<string, string> = {};
  for (const s of (sectionRows ?? []) as any[]) {
    sectionLabel[s.id] = `${s.grades?.level ?? "?"}-${s.name ?? ""}`;
    sectionTeacher[s.id] = s.profiles?.full_name ?? "—";
  }
  const enrolledBySection: Record<string, number> = {};
  for (const st of (studentRows ?? []) as any[]) {
    if (st.section_id) enrolledBySection[st.section_id] = (enrolledBySection[st.section_id] ?? 0) + 1;
  }

  // ── Group exam_results by exam ───────────────────────────────────────────────
  const rowsByExam: Record<string, any[]> = {};
  for (const r of (resultRows ?? []) as any[]) {
    (rowsByExam[r.exam_id] ??= []).push(r);
  }

  const exams: Exam[] = [];
  const studentResultsByExam: Record<string, StudentExamResult[]> = {};
  const sectionStatsByExam: Record<string, SectionExamStats[]> = {};

  for (const e of (examRows ?? []) as any[]) {
    const rows = rowsByExam[e.id] ?? [];
    const subjectNames = Array.from(new Set(rows.map((r) => r.subjects?.name).filter(Boolean))).sort();

    // Group by student
    const byStudent = new Map<string, any[]>();
    for (const r of rows) {
      (byStudent.get(r.student_id) ?? byStudent.set(r.student_id, []).get(r.student_id)!).push(r);
    }

    const results: StudentExamResult[] = [];
    for (const [studentId, studentRowsForExam] of byStudent) {
      const student = studentRowsForExam[0].students;
      const scores = subjectNames.map((subj) => {
        const row = studentRowsForExam.find((r) => r.subjects?.name === subj);
        return row ? Number(row.marks_obtained ?? 0) : 0;
      });
      const total = scores.reduce((a, b) => a + b, 0);
      const maxTotal = subjectNames.length * 100;
      const pct = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
      results.push({
        studentId,
        name: student?.full_name ?? "Unknown",
        rollNo: student?.roll_no ?? "",
        sectionId: sectionLabel[student?.section_id] ?? "—",
        attendance: Math.round(Number(student?.attendance_pct ?? 0)),
        scores,
        total,
        maxTotal,
        pct,
        grade: getGrade(pct),
        passed: scores.every((s) => s >= PASS_MARKS),
        rank: 0,
      });
    }

    // Rank within each section
    const bySection = new Map<string, StudentExamResult[]>();
    for (const r of results) {
      (bySection.get(r.sectionId) ?? bySection.set(r.sectionId, []).get(r.sectionId)!).push(r);
    }
    const sectionStats: SectionExamStats[] = [];
    for (const [sectionId, secResults] of bySection) {
      secResults.sort((a, b) => b.pct - a.pct);
      secResults.forEach((r, i) => { r.rank = i + 1; });
      const passed = secResults.filter((r) => r.passed).length;
      const pcts = secResults.map((r) => r.pct);
      sectionStats.push({
        sectionId,
        teacher: sectionTeacher[Object.keys(sectionLabel).find((k) => sectionLabel[k] === sectionId) ?? ""] ?? "—",
        enrolled: enrolledBySection[Object.keys(sectionLabel).find((k) => sectionLabel[k] === sectionId) ?? ""] ?? secResults.length,
        appeared: secResults.length,
        passed,
        passRate: secResults.length ? Math.round((passed / secResults.length) * 100) : 0,
        avgScore: secResults.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / secResults.length) : 0,
        highest: pcts.length ? Math.max(...pcts) : 0,
        lowest: pcts.length ? Math.min(...pcts) : 0,
      });
    }
    sectionStats.sort((a, b) => a.sectionId.localeCompare(b.sectionId, undefined, { numeric: true }));

    studentResultsByExam[e.id] = results;
    sectionStatsByExam[e.id] = sectionStats;

    exams.push({
      id: e.id,
      name: e.name ?? "",
      type: e.type ?? "unit_test",
      status: e.status ?? "upcoming",
      startDate: e.start_date,
      endDate: e.end_date,
      academicYear: e.academic_years?.name ?? "—",
      subjects: subjectNames,
    });
  }

  return (
    <ExamsClient
      exams={exams}
      studentResultsByExam={studentResultsByExam}
      sectionStatsByExam={sectionStatsByExam}
    />
  );
}
