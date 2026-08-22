"use client";

import { useState, useMemo } from "react";
import {
  Trophy, Users, BarChart3, CheckCircle2, ChevronRight,
  ArrowLeft, Printer, GraduationCap, Award,
} from "lucide-react";
import {
  MAX_MARKS, scoreColor, formatDate,
  type Exam, type StudentExamResult, type SectionExamStats,
} from "../_data/exams";
import { resolveGrade, gradeBandStyle, type GradeBand } from "@/lib/exams/grading";
import { getReportCardTemplate, type ReportCardSettings } from "@/lib/report-cards/templates";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

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

function GradeCard({
  result, exam, onClose, gradeBands, passMarks, schoolName, schoolLogoUrl, reportCardSettings,
}: {
  result: StudentExamResult; exam: Exam; onClose: () => void; gradeBands: GradeBand[]; passMarks: number;
  schoolName: string; schoolLogoUrl: string | null; reportCardSettings: ReportCardSettings;
}) {
  const subjectRows = exam.subjects.map((sub, i) => {
    const marks = result.scores[i];
    const pct = Math.round((marks / MAX_MARKS) * 100);
    const passed = marks >= passMarks;
    return { sub, marks, pct, grade: resolveGrade(marks, gradeBands), passed };
  });

  const template = getReportCardTemplate(reportCardSettings.templateId);
  const { visibleFields, footerNote } = reportCardSettings;

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
        <div className={`px-8 py-6 flex items-center gap-4 ${template.header}`}>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${template.crestBox}`}>
            {schoolLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={schoolLogoUrl} alt={schoolName} className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className={`h-7 w-7 ${template.crestIcon}`} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-xl font-extrabold tracking-tight ${template.headerText}`}>{schoolName}</p>
            <p className={`text-xs mt-0.5 ${template.headerSubtext}`}>Student Report Card · {exam.academicYear}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${template.headerSubtext}`}>Examination</p>
            <p className={`text-sm font-bold ${template.headerText}`}>{exam.name}</p>
            <p className={`text-xs ${template.headerSubtext}`}>{formatDate(exam.startDate)} – {formatDate(exam.endDate)}</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-gray-100 dark:border-zinc-800">
            {[
              { label: "Student Name", value: result.name, show: true },
              { label: "Roll Number",  value: result.rollNo, show: true },
              { label: "Class",        value: `Class ${result.sectionId}`, show: visibleFields.studentClass },
            ].filter((f) => f.show).map((f) => (
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
                      <td className="px-4 py-3"><span className={`text-base font-bold tabular-nums ${row.passed ? scoreColor(row.pct) : "text-red-600 dark:text-red-400"}`}>{row.marks}</span></td>
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-zinc-400">{row.pct}%</td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeBandStyle(row.grade, gradeBands)}`}>{row.grade}</span></td>
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

          {(visibleFields.attendance || visibleFields.rank) && (
            <div className="flex flex-wrap gap-6 text-sm border-t border-gray-100 dark:border-zinc-800 pt-5">
              {visibleFields.attendance && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Attendance</p>
                  <p className={`font-semibold mt-0.5 ${result.attendance >= 90 ? "text-emerald-600 dark:text-emerald-400" : result.attendance >= 75 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>{result.attendance}%</p>
                </div>
              )}
              {visibleFields.rank && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Class Rank</p>
                  <p className="font-semibold text-gray-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1">{result.rank === 1 && <Award className="h-3.5 w-3.5 text-amber-500" />}#{result.rank}</p>
                </div>
              )}
              <div className="ml-auto text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Issued</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatDate(exam.endDate)}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end text-[10px] text-gray-400 dark:text-zinc-600 border-t border-gray-100 dark:border-zinc-800 pt-4">
            <span>{footerNote}</span>
            <span>{schoolName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionResultDetail({
  exam, sectionId, sectionStats, results, onBack, gradeBands, passMarks,
  schoolName, schoolLogoUrl, reportCardSettings,
}: {
  exam: Exam;
  sectionId: string;
  sectionStats: SectionExamStats;
  results: StudentExamResult[];
  onBack: () => void;
  gradeBands: GradeBand[];
  passMarks: number;
  schoolName: string;
  schoolLogoUrl: string | null;
  reportCardSettings: ReportCardSettings;
}) {
  const [viewCard, setViewCard] = useState<StudentExamResult | null>(null);
  const sortedBands = useMemo(() => [...gradeBands].sort((a, b) => b.minPercent - a.minPercent), [gradeBands]);

  if (viewCard) {
    return (
      <GradeCard
        result={viewCard} exam={exam} onClose={() => setViewCard(null)} gradeBands={gradeBands} passMarks={passMarks}
        schoolName={schoolName} schoolLogoUrl={schoolLogoUrl} reportCardSettings={reportCardSettings}
      />
    );
  }

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
        {sortedBands.map((b) => (
          <span key={b.id} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${gradeBandStyle(b.label, gradeBands)}`}>{b.label}</span>
        ))}
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 ml-1">· Pass: {passMarks}/{MAX_MARKS} per subject · Click a student for Grade Card</span>
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
                  <span className={`text-sm font-semibold tabular-nums ${score < passMarks ? "text-red-600 dark:text-red-400" : scoreColor(score)}`}>{score}{score < passMarks && <span className="text-[9px] ml-0.5">✗</span>}</span>
                </Td>
              ))}
              <Td align="center"><span className="text-sm font-bold text-gray-900 dark:text-zinc-100 tabular-nums">{r.total}<span className="text-xs font-normal text-gray-400">/{r.maxTotal}</span></span></Td>
              <Td align="center"><span className={`text-sm font-bold tabular-nums ${scoreColor(r.pct)}`}>{r.pct}%</span></Td>
              <Td align="center"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeBandStyle(r.grade, gradeBands)}`}>{r.grade}</span></Td>
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

export default function ExamResultsClient({
  exam, sectionStats, results, gradeBands, passMarks,
  schoolName, schoolLogoUrl, reportCardSettings,
}: {
  exam: Exam;
  sectionStats: SectionExamStats[];
  results: StudentExamResult[];
  gradeBands: GradeBand[];
  passMarks: number;
  schoolName: string;
  schoolLogoUrl: string | null;
  reportCardSettings: ReportCardSettings;
}) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  if (exam.status !== "published") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
        <Trophy className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">Results haven&apos;t been published for this exam yet</p>
      </div>
    );
  }

  const selectedSectionStats = sectionStats.find((s) => s.sectionId === selectedSection);
  const selectedSectionResults = selectedSection ? results.filter((r) => r.sectionId === selectedSection) : [];

  return (
    <div className="space-y-5">
      <ResultStatsRow sectionStats={sectionStats} />

      {selectedSection && selectedSectionStats ? (
        <SectionResultDetail
          exam={exam}
          sectionId={selectedSection}
          sectionStats={selectedSectionStats}
          results={selectedSectionResults}
          onBack={() => setSelectedSection(null)}
          gradeBands={gradeBands}
          passMarks={passMarks}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
          reportCardSettings={reportCardSettings}
        />
      ) : (
        <SectionOverviewTable exam={exam} sectionStats={sectionStats} onViewSection={(id) => setSelectedSection(id)} />
      )}
    </div>
  );
}
