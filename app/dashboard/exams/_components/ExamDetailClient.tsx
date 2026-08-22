"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Trophy, CalendarClock, IdCard, ChevronRight, Users, UserCheck, ShieldCheck } from "lucide-react";
import {
  formatDate, formatDateShort,
  TYPE_LABEL, TYPE_STYLE, STATUS_LABEL, STATUS_STYLE,
  type Exam, type StudentExamResult, type SectionExamStats,
} from "../_data/exams";
import type { GradeBand } from "@/lib/exams/grading";
import type { ReportCardSettings } from "@/lib/report-cards/templates";
import type { ExamScheduleSlot, MarksGrantCombo, MarksGrantOption, MarksGrant } from "../actions";
import ExamResultsClient from "./ExamResultsClient";
import ExamTimetableClient, { type SubjectOption } from "./ExamTimetableClient";
import ExamAttendanceClient, { type AttendanceCombo, type AttendanceStudent } from "./ExamAttendanceClient";
import MarksEntryPermissionClient from "./MarksEntryPermissionClient";

export interface AdmitCardSectionOption {
  id: string;
  classNum: number;
  name: string;
  count: number;
}

type Tab = "results" | "timetable" | "attendance" | "permissions" | "admitcards";

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "results",     label: "Results",              icon: Trophy },
  { value: "timetable",   label: "Timetable",             icon: CalendarClock },
  { value: "attendance",  label: "Attendance",            icon: UserCheck },
  { value: "permissions", label: "Marks Entry Permission", icon: ShieldCheck },
  { value: "admitcards",  label: "Admit Cards",           icon: IdCard },
];

export default function ExamDetailClient({
  exam, sectionStats, results, schedule, subjects, sections, gradeBands, passMarks,
  schoolName, schoolLogoUrl, reportCardSettings,
  attendanceCombos, rosterBySection, existingAbsent,
  marksGrantCombos, marksGrantStaffOptions, marksGrants,
}: {
  exam: Exam;
  sectionStats: SectionExamStats[];
  results: StudentExamResult[];
  schedule: ExamScheduleSlot[];
  subjects: SubjectOption[];
  sections: AdmitCardSectionOption[];
  gradeBands: GradeBand[];
  passMarks: number;
  schoolName: string;
  schoolLogoUrl: string | null;
  reportCardSettings: ReportCardSettings;
  attendanceCombos: AttendanceCombo[];
  rosterBySection: Record<string, AttendanceStudent[]>;
  existingAbsent: Record<string, boolean>;
  marksGrantCombos: MarksGrantCombo[];
  marksGrantStaffOptions: MarksGrantOption[];
  marksGrants: MarksGrant[];
}) {
  const [tab, setTab] = useState<Tab>("results");

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <Link href="/dashboard/exams" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Exams
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{exam.name}</h1>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[exam.type]}`}>{TYPE_LABEL[exam.type]}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[exam.status]}`}>{STATUS_LABEL[exam.status]}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDateShort(exam.startDate)} – {formatDate(exam.endDate)} · {exam.academicYear}
          </p>
        </div>
      </div>

      <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.value ? "bg-primary-500 text-white shadow-sm" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "results" && (
        <ExamResultsClient
          exam={exam}
          sectionStats={sectionStats}
          results={results}
          gradeBands={gradeBands}
          passMarks={passMarks}
          schoolName={schoolName}
          schoolLogoUrl={schoolLogoUrl}
          reportCardSettings={reportCardSettings}
        />
      )}

      {tab === "timetable" && (
        <ExamTimetableClient examId={exam.id} subjects={subjects} initialSchedule={schedule} />
      )}

      {tab === "attendance" && (
        <ExamAttendanceClient
          examId={exam.id}
          combos={attendanceCombos}
          rosterBySection={rosterBySection}
          existingAbsent={existingAbsent}
          scheduleBySubject={Object.fromEntries(schedule.map((s) => [s.subjectId, s.examDate]))}
        />
      )}

      {tab === "permissions" && (
        <MarksEntryPermissionClient
          examId={exam.id}
          combos={marksGrantCombos}
          staffOptions={marksGrantStaffOptions}
          initialGrants={marksGrants}
        />
      )}

      {tab === "admitcards" && (
        schedule.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-16 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No papers scheduled yet — set up the timetable first so admit cards show the right dates.</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-16 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No enrolled sections found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/exams/${exam.id}/admit-cards/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">Class {s.classNum}–{s.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.count} students</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-zinc-600" />
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
