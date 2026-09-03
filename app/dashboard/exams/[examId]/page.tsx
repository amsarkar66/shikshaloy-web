import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { getSchoolGradeBands, getSchoolPassMarks } from "@/lib/exams/grading-data";
import { resolveGrade } from "@/lib/exams/grading";
import { getReportCardSettings } from "../../settings/actions";
import { listExamSchedule, listMarksEntryPermissionData } from "../actions";
import ExamDetailClient, { type AdmitCardSectionOption } from "../_components/ExamDetailClient";
import type { AttendanceCombo, AttendanceStudent } from "../_components/ExamAttendanceClient";
import type { Exam, StudentExamResult, SectionExamStats } from "../_data/exams";

interface ExamRow {
  id: string;
  name: string | null;
  type: string | null;
  status: string | null;
  start_date: string;
  end_date: string;
  academic_years: { name: string | null } | null;
}

interface SectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
  profiles: { full_name: string | null } | null;
}

interface ExamResultRow {
  student_id: string;
  subject_id: string;
  marks_obtained: number | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  students: { full_name: string | null; roll_no: string | null; attendance_pct: number | null; section_id: string | null } | null;
}

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

export default async function ExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const role = await getVerifiedRole();
  if (role !== "admin" && role !== "super_admin") return <Unauthorized />;

  // Resolved from the exam record itself (then authorized), rather than the
  // "active school" cookie — a super_admin viewing the combined exams list
  // can open an exam belonging to any of their institution's schools
  // without first switching the active school to match.
  const schoolId = await resolveAuthorizedSchoolId("exams", examId);
  const { data: examMetaRow } = await supabaseAdmin.from("exams").select("academic_year_id").eq("id", examId).maybeSingle();
  if (!examMetaRow) notFound();
  const academicYearId = examMetaRow.academic_year_id as string;

  const [
    { data: examRow },
    { data: sectionRows },
    { data: studentRows },
    { data: resultRows },
    schedule,
    { data: subjectRows },
    gradeBands,
    passMarks,
    { data: schoolRow },
    reportCardSettings,
    { data: sectionSubjectRows },
    marksEntryPermissionData,
  ] = await Promise.all([
    supabaseAdmin.from("exams").select("id, name, type, status, start_date, end_date, academic_years ( name )").eq("id", examId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("sections").select("id, name, grades ( level ), profiles ( full_name )").eq("school_id", schoolId).eq("academic_year_id", academicYearId),
    supabaseAdmin.from("students").select("id, full_name, roll_no, section_id").eq("school_id", schoolId).order("roll_no"),
    supabaseAdmin
      .from("exam_results")
      .select("student_id, subject_id, marks_obtained, is_absent, subjects ( name ), students ( full_name, roll_no, attendance_pct, section_id )")
      .eq("school_id", schoolId)
      .eq("exam_id", examId),
    listExamSchedule(examId),
    supabaseAdmin.from("subjects").select("id, name").eq("school_id", schoolId).eq("status", "active").order("name"),
    getSchoolGradeBands(schoolId),
    getSchoolPassMarks(schoolId),
    supabaseAdmin.from("schools").select("name, logo_url").eq("id", schoolId).maybeSingle(),
    getReportCardSettings(schoolId),
    supabaseAdmin.from("section_subjects").select("section_id, subject_id").eq("school_id", schoolId).eq("academic_year_id", academicYearId),
    listMarksEntryPermissionData(examId),
  ]);

  if (!examRow) notFound();
  const row = examRow as unknown as ExamRow;

  // ── Section lookups ─────────────────────────────────────────────────────────
  const sectionLabel: Record<string, string> = {};
  const sectionTeacher: Record<string, string> = {};
  for (const s of (sectionRows ?? []) as unknown as SectionRow[]) {
    sectionLabel[s.id] = `${s.grades?.level ?? "?"}-${s.name ?? ""}`;
    sectionTeacher[s.id] = s.profiles?.full_name ?? "—";
  }
  const enrolledBySection: Record<string, number> = {};
  const rosterBySection: Record<string, AttendanceStudent[]> = {};
  for (const st of (studentRows ?? []) as unknown as { id: string; full_name: string | null; roll_no: string | null; section_id: string | null }[]) {
    if (!st.section_id) continue;
    enrolledBySection[st.section_id] = (enrolledBySection[st.section_id] ?? 0) + 1;
    (rosterBySection[st.section_id] ??= []).push({ id: st.id, name: st.full_name ?? "—", rollNo: st.roll_no ?? "" });
  }

  // ── Attendance roll-call combos: every (section, subject) this school teaches ──
  const subjectNameById: Record<string, string> = {};
  for (const s of subjectRows ?? []) subjectNameById[s.id] = s.name ?? "Subject";
  const attendanceCombos: AttendanceCombo[] = ((sectionSubjectRows ?? []) as { section_id: string; subject_id: string }[])
    .filter((r) => (enrolledBySection[r.section_id] ?? 0) > 0)
    .map((r) => ({
      key: `${r.section_id}::${r.subject_id}`,
      sectionId: r.section_id,
      subjectId: r.subject_id,
      label: `Class ${sectionLabel[r.section_id] ?? "?"} · ${subjectNameById[r.subject_id] ?? "Subject"}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // ── Results, scoped to this exam ─────────────────────────────────────────────
  const rows = (resultRows ?? []) as unknown as ExamResultRow[];
  const subjectNames = Array.from(new Set(rows.map((r) => r.subjects?.name).filter((n): n is string => !!n))).sort();

  const existingAbsent: Record<string, boolean> = {};
  for (const r of rows) {
    if (r.is_absent) existingAbsent[`${r.subject_id}::${r.student_id}`] = true;
  }

  const byStudent = new Map<string, ExamResultRow[]>();
  for (const r of rows) {
    (byStudent.get(r.student_id) ?? byStudent.set(r.student_id, []).get(r.student_id)!).push(r);
  }

  const results: StudentExamResult[] = [];
  for (const [studentId, studentRowsForExam] of byStudent) {
    const student = studentRowsForExam[0].students;
    const scores = subjectNames.map((subj) => {
      const r = studentRowsForExam.find((x) => x.subjects?.name === subj);
      return r ? Number(r.marks_obtained ?? 0) : 0;
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
      grade: resolveGrade(pct, gradeBands),
      passed: scores.every((s) => s >= passMarks),
      rank: 0,
    });
  }

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

  const exam: Exam = {
    id: row.id,
    name: row.name ?? "",
    type: (row.type ?? "unit_test") as Exam["type"],
    status: (row.status ?? "upcoming") as Exam["status"],
    startDate: row.start_date,
    endDate: row.end_date,
    academicYear: row.academic_years?.name ?? "—",
    subjects: subjectNames,
  };

  // ── Admit-card section picker options ────────────────────────────────────────
  const admitCardSections: AdmitCardSectionOption[] = ((sectionRows ?? []) as unknown as SectionRow[])
    .map((s) => ({ id: s.id, classNum: s.grades?.level ?? 0, name: s.name ?? "", count: enrolledBySection[s.id] ?? 0 }))
    .filter((s) => s.count > 0)
    .sort((a, b) => a.classNum - b.classNum || a.name.localeCompare(b.name));

  return (
    <ExamDetailClient
      exam={exam}
      sectionStats={sectionStats}
      results={results}
      schedule={schedule}
      subjects={(subjectRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "Subject" }))}
      sections={admitCardSections}
      gradeBands={gradeBands}
      passMarks={passMarks}
      schoolName={schoolRow?.name ?? "School"}
      schoolLogoUrl={schoolRow?.logo_url ?? null}
      reportCardSettings={reportCardSettings}
      attendanceCombos={attendanceCombos}
      rosterBySection={rosterBySection}
      existingAbsent={existingAbsent}
      marksGrantCombos={marksEntryPermissionData.combos}
      marksGrantStaffOptions={marksEntryPermissionData.staffOptions}
      marksGrants={marksEntryPermissionData.grants}
    />
  );
}
