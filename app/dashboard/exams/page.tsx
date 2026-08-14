import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import ExamsClient from "./_components/ExamsClient";
import {
  getGrade, PASS_MARKS,
  type Exam, type StudentExamResult, type SectionExamStats,
} from "./_data/exams";

interface ExamRow {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;
  start_date: string;
  end_date: string;
  academic_years: { name: string | null } | null;
}

interface ExamSectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
  profiles: { full_name: string | null } | null;
}

interface ExamStudentRow {
  id: string;
  section_id: string | null;
}

interface ExamResultRow {
  exam_id: string;
  student_id: string;
  subject_id: string;
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  students: { full_name: string | null; roll_no: string | null; attendance_pct: number | null; section_id: string | null } | null;
}

export default async function ExamsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: examRows }, { data: sectionRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("exams")
      .select("id, name, type, status, start_date, end_date, academic_years ( name )")
      .eq("school_id", schoolId)
      .order("start_date"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),

    supabaseAdmin
      .from("students")
      .select("id, section_id")
      .eq("school_id", schoolId),
  ]);

  const examIds = ((examRows ?? []) as unknown as ExamRow[]).map((e) => e.id);

  const { data: resultRows } = examIds.length
    ? await supabaseAdmin
        .from("exam_results")
        .select(`
          exam_id, student_id, subject_id, marks_obtained, max_marks, grade, is_absent,
          subjects ( name ),
          students ( full_name, roll_no, attendance_pct, section_id )
        `)
        .eq("school_id", schoolId)
        .in("exam_id", examIds)
    : { data: [] as ExamResultRow[] };

  // ── Section lookups ─────────────────────────────────────────────────────────
  const sectionLabel: Record<string, string> = {};
  const sectionTeacher: Record<string, string> = {};
  for (const s of (sectionRows ?? []) as unknown as ExamSectionRow[]) {
    sectionLabel[s.id] = `${s.grades?.level ?? "?"}-${s.name ?? ""}`;
    sectionTeacher[s.id] = s.profiles?.full_name ?? "—";
  }
  const enrolledBySection: Record<string, number> = {};
  for (const st of (studentRows ?? []) as unknown as ExamStudentRow[]) {
    if (st.section_id) enrolledBySection[st.section_id] = (enrolledBySection[st.section_id] ?? 0) + 1;
  }

  // ── Group exam_results by exam ───────────────────────────────────────────────
  const rowsByExam: Record<string, ExamResultRow[]> = {};
  for (const r of (resultRows ?? []) as unknown as ExamResultRow[]) {
    (rowsByExam[r.exam_id] ??= []).push(r);
  }

  const exams: Exam[] = [];
  const studentResultsByExam: Record<string, StudentExamResult[]> = {};
  const sectionStatsByExam: Record<string, SectionExamStats[]> = {};

  for (const e of (examRows ?? []) as unknown as ExamRow[]) {
    const rows = rowsByExam[e.id] ?? [];
    const subjectNames = Array.from(new Set(rows.map((r) => r.subjects?.name).filter((n): n is string => !!n))).sort();

    // Group by student
    const byStudent = new Map<string, ExamResultRow[]>();
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
        sectionId: sectionLabel[student?.section_id ?? ""] ?? "—",
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
      type: (e.type ?? "unit_test") as Exam["type"],
      status: (e.status ?? "upcoming") as Exam["status"],
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
