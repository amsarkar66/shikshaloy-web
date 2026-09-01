import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";
import { scoreColor, formatDate } from "../exams/_data/exams";
import { resolveGrade, gradeBandStyle } from "@/lib/exams/grading";
import { getSchoolGradeBands } from "@/lib/exams/grading-data";
import { Award, GraduationCap, TrendingUp } from "lucide-react";
import GradebookClient, {
  type GradebookExam, type GradebookCombo, type GradebookStudent, type GradebookExisting,
} from "./_components/GradebookClient";

interface StudentExamResultRow {
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  exams: { id: string; name: string | null; type: string | null; status: string | null; start_date: string } | null;
}

interface ExamGroup {
  examId: string;
  examName: string;
  examType: string;
  date: string;
  rows: { subject: string; marks: number; max: number; grade: string; isAbsent: boolean }[];
  total: number;
  maxTotal: number;
  pct: number;
}

interface ComboSeed { sectionId: string; subjectId: string; sectionSubjectId: string; isElective: boolean }

async function Gradebook({ role, userId }: { role: string | undefined; userId: string }) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const gradeBands = await getSchoolGradeBands(schoolId);
  let comboSeeds: ComboSeed[] = [];

  if (role === "teacher") {
    const teacher = await getTeacherContext(userId);
    comboSeeds = teacher?.subjectAssignments ?? [];

    // A teacher explicitly granted marks-entry access for a combo they don't
    // normally teach (Exams > Marks Entry Permission) sees it here too — the
    // grant is exam-specific, but the combo picker isn't, so it just shows up
    // as an option; the server still checks the exam when marks are saved.
    const { data: grantRows } = await supabaseAdmin
      .from("marks_entry_grants")
      .select("section_subjects ( id, section_id, subject_id, subjects ( type ) )")
      .eq("staff_profile_id", userId);
    for (const g of grantRows ?? []) {
      const ss = g.section_subjects as unknown as { id: string; section_id: string; subject_id: string; subjects: { type: string | null } | null } | null;
      if (!ss) continue;
      if (comboSeeds.some((c) => c.sectionId === ss.section_id && c.subjectId === ss.subject_id)) continue;
      comboSeeds.push({
        sectionId: ss.section_id,
        subjectId: ss.subject_id,
        sectionSubjectId: ss.id,
        isElective: ss.subjects?.type === "elective",
      });
    }
  } else {
    const { data: ssRows } = await supabaseAdmin
      .from("section_subjects")
      .select("id, section_id, subject_id, subjects ( type )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", await getCurrentAcademicYearId());
    comboSeeds = (ssRows ?? []).map((r) => ({
      sectionId: r.section_id,
      subjectId: r.subject_id,
      sectionSubjectId: r.id,
      isElective: (r.subjects as unknown as { type: string | null } | null)?.type === "elective",
    }));
  }

  // Elective combos only show students who opted into that specific
  // subject via Exam Preference — everyone else keeps the full section roster.
  const electiveSeeds = comboSeeds.filter((c) => c.isElective);
  const electiveStudentIds: Record<string, string[]> = {};
  if (electiveSeeds.length > 0) {
    const { data: prefRows } = await supabaseAdmin
      .from("student_subject_preferences")
      .select("student_id, section_subject_id")
      .in("section_subject_id", electiveSeeds.map((c) => c.sectionSubjectId));
    const bySectionSubjectId: Record<string, string[]> = {};
    for (const r of prefRows ?? []) (bySectionSubjectId[r.section_subject_id] ??= []).push(r.student_id);
    for (const c of electiveSeeds) {
      electiveStudentIds[`${c.sectionId}::${c.subjectId}`] = bySectionSubjectId[c.sectionSubjectId] ?? [];
    }
  }

  const sectionIds = Array.from(new Set(comboSeeds.map((c) => c.sectionId)));
  const subjectIds = Array.from(new Set(comboSeeds.map((c) => c.subjectId)));

  const [{ data: examRows }, { data: sectionRows }, { data: subjectRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin.from("exams").select("id, name, type, status, start_date")
      .eq("school_id", schoolId).order("start_date", { ascending: false }),

    sectionIds.length
      ? supabaseAdmin.from("sections").select("id, name, grades ( level )").in("id", sectionIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null; grades: { level: number | null } | null }[] }),

    subjectIds.length
      ? supabaseAdmin.from("subjects").select("id, name").in("id", subjectIds)
      : Promise.resolve({ data: [] as { id: string; name: string | null }[] }),

    sectionIds.length
      ? supabaseAdmin.from("students").select("id, full_name, roll_no, section_id").in("section_id", sectionIds).order("roll_no")
      : Promise.resolve({ data: [] as { id: string; full_name: string; roll_no: string | null; section_id: string | null }[] }),
  ]);

  const sectionLabel: Record<string, string> = {};
  for (const s of (sectionRows ?? []) as unknown as { id: string; name: string | null; grades: { level: number | null } | null }[]) {
    sectionLabel[s.id] = `${s.grades?.level ?? "?"}-${s.name ?? ""}`;
  }
  const subjectName: Record<string, string> = {};
  for (const s of subjectRows ?? []) subjectName[s.id] = s.name ?? "Subject";

  const combos: GradebookCombo[] = comboSeeds.map((c) => ({
    key: `${c.sectionId}::${c.subjectId}`,
    sectionId: c.sectionId,
    subjectId: c.subjectId,
    label: `Class ${sectionLabel[c.sectionId] ?? "?"} · ${subjectName[c.subjectId] ?? "Subject"}`,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const rosterBySection: Record<string, GradebookStudent[]> = {};
  for (const st of studentRows ?? []) {
    if (!st.section_id) continue;
    (rosterBySection[st.section_id] ??= []).push({ id: st.id, name: st.full_name, rollNo: st.roll_no ?? "" });
  }

  const exams: GradebookExam[] = (examRows ?? []).map((e) => ({
    id: e.id, name: e.name ?? "Exam", type: e.type ?? "unit_test", status: e.status ?? "upcoming", startDate: e.start_date,
  }));

  const examIds = exams.map((e) => e.id);
  const rosterStudentIds = Object.values(rosterBySection).flat().map((s) => s.id);

  const { data: resultRows } = examIds.length && rosterStudentIds.length && subjectIds.length
    ? await supabaseAdmin
        .from("exam_results")
        .select("exam_id, subject_id, student_id, marks_obtained, is_absent")
        .in("exam_id", examIds)
        .in("subject_id", subjectIds)
        .in("student_id", rosterStudentIds)
    : { data: [] as { exam_id: string; subject_id: string; student_id: string; marks_obtained: number | null; is_absent: boolean | null }[] };

  const existingResults: Record<string, GradebookExisting> = {};
  for (const r of resultRows ?? []) {
    existingResults[`${r.exam_id}::${r.subject_id}::${r.student_id}`] = {
      marks: r.marks_obtained !== null ? Math.round(Number(r.marks_obtained)) : null,
      isAbsent: !!r.is_absent,
    };
  }

  return (
    <GradebookClient
      exams={exams}
      combos={combos}
      rosterBySection={rosterBySection}
      existingResults={existingResults}
      gradeBands={gradeBands}
      electiveStudentIds={electiveStudentIds}
    />
  );
}

export default async function GradesPage() {
  const vu = await getVerifiedUser();
  const role = vu?.role;

  if (!vu) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">📊</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Sign in required</p>
        </div>
      </div>
    );
  }

  if (role === "admin" || role === "super_admin" || role === "teacher") {
    return <Gradebook role={role} userId={vu.id} />;
  }

  if (role !== "student") {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to grades.</p>
        </div>
      </div>
    );
  }

  const student = await getStudentContext(vu.id);

  if (!student) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🎓</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No student record linked to this login</p>
        </div>
      </div>
    );
  }

  const [{ data: resultRows }, gradeBands] = await Promise.all([
    supabaseAdmin
      .from("exam_results")
      .select(`
        marks_obtained, max_marks, grade, is_absent,
        subjects ( name ),
        exams ( id, name, type, status, start_date )
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
    getSchoolGradeBands(await getCurrentSchoolIdOrThrow()),
  ]);

  const published = ((resultRows ?? []) as unknown as StudentExamResultRow[]).filter((r) => r.exams?.status === "published");

  const byExam = new Map<string, StudentExamResultRow[]>();
  for (const r of published) {
    const key = r.exams?.id;
    if (!key) continue;
    (byExam.get(key) ?? byExam.set(key, []).get(key)!).push(r);
  }

  const examGroups: ExamGroup[] = Array.from(byExam.entries()).map(([examId, rows]) => {
    const subjectRows = rows.map((r) => ({
      subject: r.subjects?.name ?? "Subject",
      marks: Math.round(Number(r.marks_obtained ?? 0)),
      max: Math.round(Number(r.max_marks ?? 100)),
      grade: r.grade ?? resolveGrade(Math.round((Number(r.marks_obtained ?? 0) / Number(r.max_marks || 100)) * 100), gradeBands),
      isAbsent: !!r.is_absent,
    }));
    const total = subjectRows.reduce((a, b) => a + b.marks, 0);
    const maxTotal = subjectRows.reduce((a, b) => a + b.max, 0);
    const pct = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
    return {
      examId,
      examName: rows[0].exams?.name ?? "Exam",
      examType: rows[0].exams?.type ?? "unit_test",
      date: rows[0].exams?.start_date ?? "",
      rows: subjectRows,
      total, maxTotal, pct,
    };
  }).sort((a, b) => (b.date > a.date ? 1 : -1));

  const overallPct = examGroups.length
    ? Math.round(examGroups.reduce((a, g) => a + g.pct, 0) / examGroups.length)
    : 0;

  const bestSubject = (() => {
    const bySubject: Record<string, { sum: number; count: number }> = {};
    for (const g of examGroups) for (const r of g.rows) {
      const pct = r.max ? (r.marks / r.max) * 100 : 0;
      (bySubject[r.subject] ??= { sum: 0, count: 0 });
      bySubject[r.subject].sum += pct;
      bySubject[r.subject].count += 1;
    }
    let best = "—", bestAvg = -1;
    for (const [subj, { sum, count }] of Object.entries(bySubject)) {
      const avg = sum / count;
      if (avg > bestAvg) { bestAvg = avg; best = subj; }
    }
    return best;
  })();

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Grades</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Class {student.gradeLevel}-{student.sectionName} · Roll No {student.rollNo}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Exams Published", value: String(examGroups.length), icon: GraduationCap, accent: "text-blue-500 bg-blue-500/10" },
          { label: "Overall Average", value: `${overallPct}%`, icon: TrendingUp, accent: "text-emerald-500 bg-emerald-500/10" },
          { label: "Best Subject", value: bestSubject, icon: Award, accent: "text-violet-500 bg-violet-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {examGroups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No published results yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {examGroups.map((g) => (
            <div key={g.examId} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{g.examName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{g.date ? formatDate(g.date) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${scoreColor(g.pct)}`}>{g.total}/{g.maxTotal} ({g.pct}%)</p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeBandStyle(resolveGrade(g.pct, gradeBands), gradeBands)}`}>{resolveGrade(g.pct, gradeBands)}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {g.rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span className="text-gray-700 dark:text-zinc-300">{r.subject}</span>
                    <div className="flex items-center gap-3">
                      {r.isAbsent ? (
                        <span className="text-xs text-red-500 dark:text-red-400 font-medium">Absent</span>
                      ) : (
                        <>
                          <span className={`font-semibold ${scoreColor(r.max ? (r.marks / r.max) * 100 : 0)}`}>{r.marks}/{r.max}</span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeBandStyle(r.grade, gradeBands)}`}>{r.grade}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
