"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck, Trophy, Users, BarChart3,
  CalendarDays, BookOpen, Download,
  ArrowLeft, ChevronRight, ChevronDown, CheckCircle2, Clock, Eye,
  Printer, GraduationCap, Award,
} from "lucide-react";
import {
  MAX_MARKS, PASS_MARKS,
  gradeStyle, scoreColor, formatDate, formatDateShort,
  type Exam, type ExamType, type ExamStatus, type StudentExamResult, type SectionExamStats,
} from "../_data/exams";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

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

function ExamStatsRow({ exams }: { exams: Exam[] }) {
  const total = exams.length;
  const upcoming = exams.filter((e) => e.status === "upcoming" || e.status === "ongoing").length;
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

function ExamCard({ exam, onViewResults }: { exam: Exam; onViewResults: (id: string) => void }) {
  const isPublished = exam.status === "published";
  const isUpcoming = exam.status === "upcoming" || exam.status === "ongoing";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[exam.type]}`}>{TYPE_LABEL[exam.type]}</span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[exam.status]}`}>{STATUS_LABEL[exam.status]}</span>
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
          {exam.subjects.length === 0 ? (
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">No subjects recorded yet</span>
          ) : exam.subjects.map((s) => (
            <span key={s} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">{s}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        {isPublished ? (
          <FancyButton onClick={() => onViewResults(exam.id)} size="xs" className="flex-1">
            <Trophy className="h-3.5 w-3.5" /> View Results
          </FancyButton>
        ) : (
          <span className="flex-1 text-xs text-gray-400 dark:text-zinc-500">{isUpcoming ? `Starts ${formatDateShort(exam.startDate)}` : "Awaiting publication"}</span>
        )}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ResultStatsRow({ sectionStats }: { sectionStats: SectionExamStats[] }) {
  const totalAppeared = sectionStats.reduce((a, s) => a + s.appeared, 0);
  const totalPassed = sectionStats.reduce((a, s) => a + s.passed, 0);
  const avgScore = sectionStats.length ? Math.round(sectionStats.reduce((a, s) => a + s.avgScore, 0) / sectionStats.length) : 0;
  const passRate = totalAppeared ? Math.round((totalPassed / totalAppeared) * 100) : 0;

  const items = [
    { label: "Pass Rate",      value: `${passRate}%`, icon: Trophy,       color: passRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400", bg: "bg-emerald-500/10" },
    { label: "School Average", value: `${avgScore}%`, icon: BarChart3,    color: "text-blue-600    dark:text-blue-400",   bg: "bg-blue-500/10"   },
    { label: "Total Appeared", value: totalAppeared,  icon: Users,        color: "text-indigo-600  dark:text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Total Passed",   value: totalPassed,    icon: CheckCircle2, color: "text-violet-600  dark:text-violet-400", bg: "bg-violet-500/10" },
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

function SectionOverviewTable({ exam, sectionStats, onViewSection }: { exam: Exam; sectionStats: SectionExamStats[]; onViewSection: (id: string) => void }) {
  function rateBar(rate: number) { return rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-red-500"; }
  function rateText(rate: number) { return rate >= 90 ? "text-emerald-600 dark:text-emerald-400" : rate >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"; }

  return (
    <Table
      header={
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Section Results Overview</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{sectionStats.length} section{sectionStats.length === 1 ? "" : "s"} with results · {exam.subjects.length} subjects × {MAX_MARKS} marks each</p>
        </div>
      }
    >
      <TableHead>
        <Th position="first">Section</Th>
        <Th>Class Teacher</Th>
        <Th>Appeared</Th>
        <Th>Passed</Th>
        <Th>Pass %</Th>
        <Th>Avg Score</Th>
        <Th>Highest</Th>
        <Th>Lowest</Th>
        <Th position="last"></Th>
      </TableHead>
      <TableBody>
        {sectionStats.length === 0 ? (
          <TableEmptyRow colSpan={9} message="No results recorded for any section yet." />
        ) : sectionStats.map((r) => (
          <Tr key={r.sectionId}>
            <Td position="first"><div className="flex h-7 w-12 items-center justify-center rounded-lg bg-primary-500/10"><span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">{r.sectionId}</span></div></Td>
            <Td className="text-xs text-gray-600 dark:text-zinc-400 whitespace-nowrap">{r.teacher}</Td>
            <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300">{r.appeared}</Td>
            <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300">{r.passed}</Td>
            <Td>
              <div className="flex items-center gap-2">
                <div className="w-14 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700"><div className={`h-1.5 rounded-full ${rateBar(r.passRate)}`} style={{ width: `${r.passRate}%` }} /></div>
                <span className={`text-xs font-semibold tabular-nums ${rateText(r.passRate)}`}>{r.passRate}%</span>
              </div>
            </Td>
            <Td><span className={`text-sm font-semibold tabular-nums ${scoreColor(r.avgScore)}`}>{r.avgScore}%</span></Td>
            <Td className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{r.highest}%</Td>
            <Td className="text-xs font-medium tabular-nums text-red-500 dark:text-red-400">{r.lowest}%</Td>
            <Td position="last">
              <button onClick={() => onViewSection(r.sectionId)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">
                Students <ChevronRight className="h-3 w-3" />
              </button>
            </Td>
          </Tr>
        ))}
      </TableBody>
    </Table>
  );
}

function GradeCard({ result, exam, onClose }: { result: StudentExamResult; exam: Exam; onClose: () => void }) {
  const subjectRows = exam.subjects.map((sub, i) => {
    const marks = result.scores[i];
    const passed = marks >= PASS_MARKS;
    return { sub, marks, grade: getGradeLocal(marks), passed };
  });

  function getGradeLocal(pct: number): string {
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 35) return "D";
    return "F";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </button>
        <FancyButton onClick={() => window.print()} size="xs" className="sm:ml-auto">
          <Printer className="h-3.5 w-3.5" /> Print Grade Card
        </FancyButton>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm print:shadow-none print:border-black">
        <div className="bg-primary-600 px-8 py-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20"><GraduationCap className="h-7 w-7 text-white" /></div>
          <div className="flex-1">
            <p className="text-xl font-extrabold text-white tracking-tight">Shikshaloy School</p>
            <p className="text-primary-200 text-xs mt-0.5">Student Report Card · {exam.academicYear}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-primary-200 text-[10px] uppercase tracking-widest font-semibold">Examination</p>
            <p className="text-white text-sm font-bold">{exam.name}</p>
            <p className="text-primary-200 text-xs">{formatDate(exam.startDate)} – {formatDate(exam.endDate)}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Student Name", value: result.name },
              { label: "Roll Number",  value: result.rollNo },
              { label: "Class",        value: `Class ${result.sectionId}` },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{f.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Subject-wise Performance</p>
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700">
                  <tr>
                    {["Subject", "Max Marks", "Marks Obtained", "Percentage", "Grade", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {subjectRows.map((row) => (
                    <tr key={row.sub} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-zinc-200">{row.sub}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 tabular-nums">{MAX_MARKS}</td>
                      <td className="px-4 py-3"><span className={`text-base font-bold tabular-nums ${row.passed ? scoreColor(row.marks) : "text-red-600 dark:text-red-400"}`}>{row.marks}</span></td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-zinc-400">{row.marks}%</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeStyle(row.grade)}`}>{row.grade}</span></td>
                      <td className="px-4 py-3">{row.passed ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Pass</span> : <span className="text-xs font-medium text-red-600 dark:text-red-400">✗ Fail</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 p-5">
            {[
              { label: "Total Marks",   value: `${result.total} / ${result.maxTotal}`, color: "text-gray-900 dark:text-zinc-100" },
              { label: "Percentage",    value: `${result.pct}%`,                        color: scoreColor(result.pct)             },
              { label: "Overall Grade", value: result.grade,                             color: "text-gray-900 dark:text-zinc-100" },
              { label: "Result",        value: result.passed ? "PASS" : "FAIL",         color: result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{s.label}</p>
                <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6 text-sm border-t border-gray-100 dark:border-zinc-800 pt-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Attendance</p>
              <p className={`font-semibold mt-0.5 ${result.attendance >= 90 ? "text-emerald-600 dark:text-emerald-400" : result.attendance >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{result.attendance}%</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Class Rank</p>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">{result.rank === 1 && <Award className="h-3.5 w-3.5 text-amber-500" />}#{result.rank}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Issued</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatDate(exam.endDate)}</p>
            </div>
          </div>

          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <span>This is a computer-generated grade card.</span>
            <span>Shikshaloy School Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionResultDetail({
  exam, sectionId, sectionStats, results, onBack,
}: {
  exam: Exam;
  sectionId: string;
  sectionStats: SectionExamStats;
  results: StudentExamResult[];
  onBack: () => void;
}) {
  const [viewCard, setViewCard] = useState<StudentExamResult | null>(null);

  if (viewCard) return <GradeCard result={viewCard} exam={exam} onClose={() => setViewCard(null)} />;

  const sorted = [...results].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors self-start">
          <ArrowLeft className="h-4 w-4" /> All Sections
        </button>
        <div className="sm:ml-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500"><span className="text-[10px] font-bold text-white">{sectionId}</span></div>
            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">Class {sectionId} — {exam.name}</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 ml-9">{sectionStats.teacher} · Showing {sorted.length} of {sectionStats.enrolled} enrolled students</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["A+", "A", "B+", "B", "C", "D", "F"].map((g) => (
          <span key={g} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${gradeStyle(g)}`}>{g}</span>
        ))}
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 ml-1">· Pass: {PASS_MARKS}/{MAX_MARKS} per subject · Click a student for Grade Card</span>
      </div>

      <Table>
        <TableHead>
          <Th position="first">#</Th>
          <Th>Student</Th>
          <Th>Roll No</Th>
          {exam.subjects.map((sub) => (
            <Th key={sub} align="center">{sub.split(" ")[0]}</Th>
          ))}
          <Th align="center">Total</Th>
          <Th align="center">%</Th>
          <Th align="center">Grade</Th>
          <Th position="last" align="right">Card</Th>
        </TableHead>
        <TableBody>
          {sorted.length === 0 ? (
            <TableEmptyRow colSpan={5 + exam.subjects.length} message="No student records available for this section" />
          ) : sorted.map((r) => (
            <Tr key={r.studentId} className={!r.passed ? "bg-red-50/40 dark:bg-red-500/5" : ""}>
              <Td position="first"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${r.rank === 1 ? "bg-amber-400 text-white" : r.rank === 2 ? "bg-gray-400 dark:bg-zinc-500 text-white" : r.rank === 3 ? "bg-amber-700 text-white" : "text-gray-400 dark:text-zinc-500"}`}>{r.rank}</span></Td>
              <Td><p className="font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{r.name}</p></Td>
              <Td className="font-mono text-xs text-gray-400 dark:text-zinc-500">{r.rollNo}</Td>
              {r.scores.map((score, i) => (
                <Td key={i} align="center">
                  <span className={`text-sm font-semibold tabular-nums ${score < PASS_MARKS ? "text-red-600 dark:text-red-400" : scoreColor(score)}`}>{score}{score < PASS_MARKS && <span className="text-[9px] ml-0.5">✗</span>}</span>
                </Td>
              ))}
              <Td align="center"><span className="text-sm font-bold text-gray-900 dark:text-zinc-100 tabular-nums">{r.total}<span className="text-xs font-normal text-gray-400">/{r.maxTotal}</span></span></Td>
              <Td align="center"><span className={`text-sm font-bold tabular-nums ${scoreColor(r.pct)}`}>{r.pct}%</span></Td>
              <Td align="center"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeStyle(r.grade)}`}>{r.grade}</span></Td>
              <Td position="last" align="right">
                <button onClick={() => setViewCard(r)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                  <Printer className="h-3 w-3" /> Card
                </button>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExamPicker({ published, onSelect }: { published: Exam[]; onSelect: (id: string) => void }) {
  const byYear = useMemo(() => {
    const map = new Map<string, Exam[]>();
    published.forEach((e) => {
      (map.get(e.academicYear) ?? map.set(e.academicYear, []).get(e.academicYear)!).push(e);
    });
    return map;
  }, [published]);

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Trophy className="h-8 w-8 text-violet-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">Select an exam to view results</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Showing exams with published results</p>
      </div>
      {published.length === 0 ? (
        <p className="text-center text-sm text-gray-400 dark:text-zinc-500">No published results yet.</p>
      ) : Array.from(byYear.entries()).map(([year, exams]) => (
        <div key={year}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">{year}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map((exam) => (
              <button key={exam.id} onClick={() => onSelect(exam.id)} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-left hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors"><Trophy className="h-5 w-5 text-violet-500" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{exam.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{formatDateShort(exam.startDate)} – {formatDateShort(exam.endDate)}</p>
                  <span className={`inline-flex mt-1 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_STYLE[exam.type]}`}>{TYPE_LABEL[exam.type]}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "exams" | "results";
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "published", label: "Results Published" },
];

export default function ExamsClient({
  exams, studentResultsByExam, sectionStatsByExam,
}: {
  exams: Exam[];
  studentResultsByExam: Record<string, StudentExamResult[]>;
  sectionStatsByExam: Record<string, SectionExamStats[]>;
}) {
  const academicYears = useMemo(() => Array.from(new Set(exams.map((e) => e.academicYear))), [exams]);
  const [tab, setTab] = useState<Tab>("exams");
  const [yearFilter, setYearFilter] = useState(academicYears[0] ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const yearExams = useMemo(() => exams.filter((e) => e.academicYear === yearFilter), [exams, yearFilter]);
  const filteredExams = useMemo(() => statusFilter === "all" ? yearExams : yearExams.filter((e) => e.status === statusFilter), [yearExams, statusFilter]);
  const publishedExams = useMemo(() => exams.filter((e) => e.status === "published"), [exams]);
  const selectedExam = useMemo(() => exams.find((e) => e.id === selectedExamId) ?? null, [exams, selectedExamId]);
  const selectedSectionStats = selectedExam ? (sectionStatsByExam[selectedExam.id] ?? []).find((s) => s.sectionId === selectedSection) : undefined;
  const selectedSectionResults = selectedExam && selectedSection ? (studentResultsByExam[selectedExam.id] ?? []).filter((r) => r.sectionId === selectedSection) : [];

  function viewResults(examId: string) {
    setSelectedExamId(examId);
    setSelectedSection(null);
    setTab("results");
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Exams &amp; Results</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage examinations and publish student results</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {academicYears.length > 0 && (
            <div className="relative">
              <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setStatusFilter("all"); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          )}
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5" /> Export</button>
        </div>
      </div>

      <ExamStatsRow exams={yearExams} />

      <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit">
        {(["exams", "results"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-primary-500 text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
            {t === "exams" ? <ClipboardCheck className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
            {t === "exams" ? "Exams" : "Results"}
          </button>
        ))}
      </div>

      {tab === "exams" && (
        <>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTER_OPTIONS.map((f) => {
              const count = f.value === "all" ? yearExams.length : yearExams.filter((e) => e.status === f.value).length;
              return (
                <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium transition-colors ${statusFilter === f.value ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
                  {f.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>{count}</span>
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
              {filteredExams.map((exam) => <ExamCard key={exam.id} exam={exam} onViewResults={viewResults} />)}
            </div>
          )}
        </>
      )}

      {tab === "results" && (
        <>
          {!selectedExam ? (
            <ExamPicker published={publishedExams} onSelect={(id) => { setSelectedExamId(id); setSelectedSection(null); }} />
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[selectedExam.type]}`}>{TYPE_LABEL[selectedExam.type]}</span>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{selectedExam.name}</p>
                <span className="text-xs text-gray-400 dark:text-zinc-500">{selectedExam.academicYear} · {formatDate(selectedExam.startDate)} – {formatDate(selectedExam.endDate)}</span>
                <button onClick={() => { setSelectedExamId(null); setSelectedSection(null); }} className="sm:ml-auto text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">Change Exam</button>
              </div>

              <ResultStatsRow sectionStats={sectionStatsByExam[selectedExam.id] ?? []} />

              {selectedSection && selectedSectionStats ? (
                <SectionResultDetail
                  exam={selectedExam}
                  sectionId={selectedSection}
                  sectionStats={selectedSectionStats}
                  results={selectedSectionResults}
                  onBack={() => setSelectedSection(null)}
                />
              ) : (
                <SectionOverviewTable exam={selectedExam} sectionStats={sectionStatsByExam[selectedExam.id] ?? []} onViewSection={(id) => setSelectedSection(id)} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
