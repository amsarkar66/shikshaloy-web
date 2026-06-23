"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Trophy, Users, BarChart3,
  CalendarDays, BookOpen, Plus, Download,
  ArrowLeft, ChevronRight, CheckCircle2, Clock, Eye,
  Printer, GraduationCap, Award,
} from "lucide-react";
import {
  ALL_EXAMS, ALL_SECTIONS, EXAM_SUBJECTS, ACADEMIC_YEARS,
  MAX_MARKS, PASS_MARKS,
  getSectionExamStats, getSectionStudentResults, getExamSchoolStats,
  getGrade, gradeStyle, scoreColor, formatDate, formatDateShort,
  type Exam, type ExamType, type ExamStatus,
} from "./_data/exams";

// ── Display maps ──────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ExamType, string> = {
  unit_test: "Unit Test",
  mid_term:  "Mid-Term",
  final:     "Final Exam",
};

const TYPE_STYLE: Record<ExamType, string> = {
  unit_test: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20",
  mid_term:  "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",
  final:     "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
};

const STATUS_LABEL: Record<ExamStatus, string> = {
  upcoming:  "Upcoming",
  ongoing:   "Ongoing",
  completed: "Completed",
  published: "Results Published",
};

const STATUS_STYLE: Record<ExamStatus, string> = {
  upcoming:  "bg-zinc-100      dark:bg-zinc-800     text-zinc-600    dark:text-zinc-400   border-zinc-200 dark:border-zinc-700",
  ongoing:   "bg-sky-500/10    text-sky-600         dark:text-sky-400     border-sky-500/20",
  completed: "bg-emerald-500/10 text-emerald-600    dark:text-emerald-400 border-emerald-500/20",
  published: "bg-violet-500/10 text-violet-700      dark:text-violet-300  border-violet-500/20",
};

// ── Exams tab — stats row ─────────────────────────────────────────────────────

function ExamStatsRow({ exams }: { exams: Exam[] }) {
  const total     = exams.length;
  const upcoming  = exams.filter((e) => e.status === "upcoming" || e.status === "ongoing").length;
  const completed = exams.filter((e) => e.status === "completed" || e.status === "published").length;
  const published = exams.filter((e) => e.status === "published").length;

  const items = [
    { label: "Total Exams",       value: total,     icon: ClipboardCheck, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Upcoming",          value: upcoming,  icon: Clock,          accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Completed",         value: completed, icon: CheckCircle2,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Results Published", value: published, icon: Trophy,         accent: "text-violet-500  bg-violet-500/10"  },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
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
  );
}

// ── Exam card ─────────────────────────────────────────────────────────────────

function ExamCard({ exam, onViewResults }: { exam: Exam; onViewResults: (id: number) => void }) {
  const subjects    = EXAM_SUBJECTS[exam.type];
  const isPublished = exam.status === "published";
  const isUpcoming  = exam.status === "upcoming" || exam.status === "ongoing";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[exam.type]}`}>
          {TYPE_LABEL[exam.type]}
        </span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[exam.status]}`}>
          {STATUS_LABEL[exam.status]}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{exam.name}</h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{exam.academicYear}</p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>{formatDateShort(exam.startDate)} – {formatDate(exam.endDate)}</span>
      </div>

      <div className="flex items-start gap-1.5">
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500 mt-0.5" />
        <div className="flex flex-wrap gap-1">
          {subjects.map((s) => (
            <span key={s} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        {isPublished ? (
          <button
            onClick={() => onViewResults(exam.id)}
            className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" /> View Results
          </button>
        ) : (
          <span className="flex-1 text-xs text-gray-400 dark:text-zinc-500">
            {isUpcoming ? `Starts ${formatDateShort(exam.startDate)}` : "Awaiting publication"}
          </span>
        )}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Results tab — school stats ────────────────────────────────────────────────

function ResultStatsRow({ exam }: { exam: Exam }) {
  const { totalAppeared, totalPassed, avgScore, passRate } = useMemo(
    () => getExamSchoolStats(exam),
    [exam],
  );

  const items = [
    { label: "Pass Rate",      value: `${passRate}%`,  icon: Trophy,        color: passRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400", bg: "bg-emerald-500/10" },
    { label: "School Average", value: `${avgScore}%`,  icon: BarChart3,     color: "text-blue-600    dark:text-blue-400",   bg: "bg-blue-500/10"   },
    { label: "Total Appeared", value: totalAppeared,   icon: Users,         color: "text-indigo-600  dark:text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Total Passed",   value: totalPassed,     icon: CheckCircle2,  color: "text-violet-600  dark:text-violet-400", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
            <s.icon className={`h-5 w-5 ${s.color}`} />
          </div>
          <div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section overview table ────────────────────────────────────────────────────

function SectionOverviewTable({
  exam, onViewSection,
}: {
  exam: Exam;
  onViewSection: (id: string) => void;
}) {
  const rows = useMemo(() => ALL_SECTIONS.map((sec) => getSectionExamStats(sec, exam)), [exam]);

  function rateBar(rate: number) {
    if (rate >= 90) return "bg-emerald-500";
    if (rate >= 75) return "bg-amber-500";
    return "bg-red-500";
  }

  function rateText(rate: number) {
    if (rate >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (rate >= 75) return "text-amber-600   dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Section Results Overview</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          All 12 sections · {EXAM_SUBJECTS[exam.type].length} subjects × {100} marks each
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
            <tr>
              {["Section", "Class Teacher", "Appeared", "Passed", "Pass %", "Avg Score", "Highest", "Lowest", ""].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {rows.map((r) => (
              <tr key={r.section.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex h-7 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{r.section.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-zinc-400 whitespace-nowrap">{r.section.teacher}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300">{r.appeared}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300">{r.passed}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                      <div className={`h-1.5 rounded-full ${rateBar(r.passRate)}`} style={{ width: `${r.passRate}%` }} />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${rateText(r.passRate)}`}>{r.passRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold tabular-nums ${scoreColor(r.avgScore)}`}>{r.avgScore}%</span>
                </td>
                <td className="px-4 py-3 text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{r.highest}%</td>
                <td className="px-4 py-3 text-xs font-medium tabular-nums text-red-500 dark:text-red-400">{r.lowest}%</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewSection(r.section.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                  >
                    Students <ChevronRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Grade card ────────────────────────────────────────────────────────────────

function GradeCard({
  result, exam, sectionId, onClose,
}: {
  result:    import("./_data/exams").StudentExamResult;
  exam:      Exam;
  sectionId: string;
  onClose:   () => void;
}) {
  const section  = ALL_SECTIONS.find((s) => s.id === sectionId)!;
  const subjects = EXAM_SUBJECTS[exam.type];
  const maxTotal = subjects.length * MAX_MARKS;

  const subjectRows = subjects.map((sub, i) => {
    const marks   = result.scores[i];
    const pct     = marks;
    const passed  = marks >= PASS_MARKS;
    const grade   = getGrade(pct);
    return { sub, marks, grade, passed };
  });

  function handlePrint() { window.print(); }

  return (
    <div className="space-y-4">
      {/* Back + actions */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </button>
        <button
          onClick={handlePrint}
          className="sm:ml-auto flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 text-xs font-medium text-white transition-colors"
        >
          <Printer className="h-3.5 w-3.5" /> Print Grade Card
        </button>
        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {/* Grade card */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm print:shadow-none print:border-black">

        {/* Header band */}
        <div className="bg-indigo-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xl font-extrabold text-white tracking-tight">Shikshaloy School</p>
            <p className="text-indigo-200 text-xs mt-0.5">Student Report Card · {exam.academicYear}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-indigo-200 text-[10px] uppercase tracking-widest font-semibold">Examination</p>
            <p className="text-white text-sm font-bold">{exam.name}</p>
            <p className="text-indigo-200 text-xs">{formatDate(exam.startDate)} – {formatDate(exam.endDate)}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Student info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Student Name", value: result.student.name },
              { label: "Roll Number",  value: result.student.rollNo },
              { label: "Class",        value: `Class ${sectionId}` },
              { label: "Class Teacher",value: section.teacher },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Marks table */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Subject-wise Performance</p>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    {["Subject", "Max Marks", "Marks Obtained", "Percentage", "Grade", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {subjectRows.map((row) => (
                    <tr key={row.sub} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-zinc-200">{row.sub}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 tabular-nums">{MAX_MARKS}</td>
                      <td className="px-4 py-3">
                        <span className={`text-base font-bold tabular-nums ${row.passed ? scoreColor(row.marks) : "text-red-600 dark:text-red-400"}`}>
                          {row.marks}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-zinc-400">{row.marks}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeStyle(row.grade)}`}>
                          {row.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">✗ Fail</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-5">
            {[
              { label: "Total Marks",  value: `${result.total} / ${maxTotal}`,   color: "text-gray-900 dark:text-zinc-100" },
              { label: "Percentage",   value: `${result.pct}%`,                  color: scoreColor(result.pct)             },
              { label: "Overall Grade",value: result.grade,                       color: "text-gray-900 dark:text-zinc-100" },
              { label: "Result",       value: result.passed ? "PASS" : "FAIL",   color: result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{s.label}</p>
                <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                {s.label === "Overall Grade" && (
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold mt-1 ${gradeStyle(result.grade)}`}>
                    {result.grade}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Attendance + rank */}
          <div className="flex flex-wrap gap-6 text-sm border-t border-gray-100 dark:border-zinc-800 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Attendance</p>
              <p className={`font-semibold mt-0.5 ${
                result.student.attendance >= 90 ? "text-emerald-600 dark:text-emerald-400"
                : result.student.attendance >= 75 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400"
              }`}>{result.student.attendance}%</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Class Rank</p>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                {result.rank === 1 && <Award className="h-3.5 w-3.5 text-amber-500" />}
                #{result.rank}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Issued</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatDate(exam.endDate)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <span>This is a computer-generated grade card.</span>
            <span>Shikshaloy School Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section student detail ────────────────────────────────────────────────────

function SectionResultDetail({
  exam, sectionId, onBack,
}: {
  exam:      Exam;
  sectionId: string;
  onBack:    () => void;
}) {
  const subjects  = EXAM_SUBJECTS[exam.type];
  const results   = useMemo(() => getSectionStudentResults(sectionId, exam), [sectionId, exam]);
  const section   = ALL_SECTIONS.find((s) => s.id === sectionId)!;
  const [viewCard, setViewCard] = useState<import("./_data/exams").StudentExamResult | null>(null);

  if (viewCard) {
    return (
      <GradeCard
        result={viewCard}
        exam={exam}
        sectionId={sectionId}
        onClose={() => setViewCard(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" /> All Sections
        </button>
        <div className="sm:ml-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <span className="text-[10px] font-bold text-white">{sectionId}</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Class {sectionId} — {exam.name}
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 ml-9">
            {section.teacher} · Showing {results.length} of {section.enrolled} enrolled students
          </p>
        </div>
        <button className="sm:ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export All
        </button>
      </div>

      {/* Grade legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {["A+", "A", "B+", "B", "C", "D", "F"].map((g) => (
          <span key={g} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${gradeStyle(g)}`}>
            {g}
          </span>
        ))}
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 ml-1">
          · Pass: {PASS_MARKS}/{MAX_MARKS} per subject · Click a student for Grade Card
        </span>
      </div>

      {/* Results table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 w-10">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Roll No</th>
                {subjects.map((sub) => (
                  <th key={sub} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                    {sub.split(" ")[0]}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">%</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Grade</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={5 + subjects.length} className="py-14 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No student records available for this section
                  </td>
                </tr>
              ) : results.map((r) => (
                <tr
                  key={r.student.id}
                  className={`hover:bg-gray-50 dark:hover:bg-zinc-700/20 transition-colors ${!r.passed ? "bg-red-50/40 dark:bg-red-500/5" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      r.rank === 1 ? "bg-amber-400 text-white" :
                      r.rank === 2 ? "bg-gray-400 dark:bg-zinc-500 text-white" :
                      r.rank === 3 ? "bg-amber-700 text-white" :
                      "text-gray-400 dark:text-zinc-500"
                    }`}>
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{r.student.name}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 dark:text-zinc-500">{r.student.rollNo}</td>
                  {r.scores.map((score, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      <span className={`text-sm font-semibold tabular-nums ${
                        score < PASS_MARKS ? "text-red-600 dark:text-red-400" : scoreColor(score)
                      }`}>
                        {score}
                        {score < PASS_MARKS && <span className="text-[9px] ml-0.5">✗</span>}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                      {r.total}<span className="text-xs font-normal text-gray-400">/{r.maxTotal}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold tabular-nums ${scoreColor(r.pct)}`}>{r.pct}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeStyle(r.grade)}`}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewCard(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                    >
                      <Printer className="h-3 w-3" /> Card
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Exam picker (results tab landing) ────────────────────────────────────────

function ExamPicker({ published, onSelect }: { published: Exam[]; onSelect: (id: number) => void }) {
  const byYear = useMemo(() => {
    const map = new Map<string, Exam[]>();
    ACADEMIC_YEARS.forEach((y) => map.set(y, []));
    published.forEach((e) => map.get(e.academicYear)?.push(e));
    return map;
  }, [published]);

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Trophy className="h-8 w-8 text-violet-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Select an exam to view results</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Showing exams with published results</p>
      </div>
      {ACADEMIC_YEARS.map((year) => {
        const exams = byYear.get(year) ?? [];
        if (exams.length === 0) return null;
        return (
          <div key={year}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">{year}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => onSelect(exam.id)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-left hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all group"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                    <Trophy className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{exam.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {formatDateShort(exam.startDate)} – {formatDateShort(exam.endDate)}
                    </p>
                    <span className={`inline-flex mt-1 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_STYLE[exam.type]}`}>
                      {TYPE_LABEL[exam.type]}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "exams" | "results";

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All"               },
  { value: "upcoming",  label: "Upcoming"          },
  { value: "ongoing",   label: "Ongoing"           },
  { value: "completed", label: "Completed"         },
  { value: "published", label: "Results Published" },
];

export default function ExamsPage() {
  const [tab,             setTab]            = useState<Tab>("exams");
  const [yearFilter,      setYearFilter]     = useState("2026-27");
  const [statusFilter,    setStatusFilter]   = useState("all");
  const [selectedExamId,  setSelectedExamId] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const yearExams     = useMemo(() => ALL_EXAMS.filter((e) => e.academicYear === yearFilter), [yearFilter]);
  const filteredExams = useMemo(() => {
    if (statusFilter === "all") return yearExams;
    return yearExams.filter((e) => e.status === statusFilter);
  }, [yearExams, statusFilter]);

  const publishedExams = useMemo(() => ALL_EXAMS.filter((e) => e.status === "published"), []);
  const selectedExam   = useMemo(() => ALL_EXAMS.find((e) => e.id === selectedExamId) ?? null, [selectedExamId]);

  function viewResults(examId: number) {
    setSelectedExamId(examId);
    setSelectedSection(null);
    setTab("results");
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Exams &amp; Results</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage examinations and publish student results</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setStatusFilter("all"); }}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0">
            <Plus className="h-4 w-4" /> Add Exam
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit">
        {(["exams", "results"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            {t === "exams" ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
            {t === "exams" ? "Exams" : "Results"}
          </button>
        ))}
      </div>

      {/* ── Exams tab ────────────────────────────────────────────────────────── */}
      {tab === "exams" && (
        <>
          <ExamStatsRow exams={yearExams} />

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTER_OPTIONS.map((f) => {
              const count = f.value === "all"
                ? yearExams.length
                : yearExams.filter((e) => e.status === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                    statusFilter === f.value
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    statusFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {filteredExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
              <ClipboardCheck className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">No exams match this filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} onViewResults={viewResults} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Results tab ──────────────────────────────────────────────────────── */}
      {tab === "results" && (
        <>
          {!selectedExam ? (
            <ExamPicker
              published={publishedExams}
              onSelect={(id) => { setSelectedExamId(id); setSelectedSection(null); }}
            />
          ) : (
            <div className="space-y-5">
              {/* Selected exam strip */}
              <div className="flex items-center gap-3 flex-wrap rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[selectedExam.type]}`}>
                  {TYPE_LABEL[selectedExam.type]}
                </span>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  {selectedExam.name}
                </p>
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  {selectedExam.academicYear} · {formatDate(selectedExam.startDate)} – {formatDate(selectedExam.endDate)}
                </span>
                <button
                  onClick={() => { setSelectedExamId(null); setSelectedSection(null); }}
                  className="sm:ml-auto text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Change Exam
                </button>
              </div>

              <ResultStatsRow exam={selectedExam} />

              {selectedSection ? (
                <SectionResultDetail
                  exam={selectedExam}
                  sectionId={selectedSection}
                  onBack={() => setSelectedSection(null)}
                />
              ) : (
                <SectionOverviewTable
                  exam={selectedExam}
                  onViewSection={(id) => setSelectedSection(id)}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
