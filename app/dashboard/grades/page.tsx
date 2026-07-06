import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getStudentContext } from "@/lib/students/context";
import { getGrade, gradeStyle, scoreColor, formatDate } from "../exams/_data/exams";
import { Award, GraduationCap, TrendingUp } from "lucide-react";

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

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (!user || role !== "student") {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">📊</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Gradebook coming soon</p>
          <p className="max-w-xs text-sm text-gray-500 dark:text-zinc-400">A dedicated view for entering and reviewing class results is on the way.</p>
        </div>
      </div>
    );
  }

  const student = await getStudentContext(user.id);

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

  const { data: resultRows } = await supabaseAdmin
    .from("exam_results")
    .select(`
      marks_obtained, max_marks, grade, is_absent,
      subjects ( name ),
      exams ( id, name, type, status, start_date )
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  const published = ((resultRows ?? []) as any[]).filter((r) => r.exams?.status === "published");

  const byExam = new Map<string, any[]>();
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
      grade: r.grade ?? getGrade(Math.round((Number(r.marks_obtained ?? 0) / Number(r.max_marks || 100)) * 100)),
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
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeStyle(getGrade(g.pct))}`}>{getGrade(g.pct)}</span>
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
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${gradeStyle(r.grade)}`}>{r.grade}</span>
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
