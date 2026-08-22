"use client";

import { Printer, Hash, MapPin } from "lucide-react";
import type { ExamScheduleSlot } from "../actions";

export interface AdmitCardStudent {
  id: string;
  name: string;
  rollNo: string;
  photoUrl: string | null;
  schedule: ExamScheduleSlot[];
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function AdmitCard({
  schoolName, schoolLogoUrl, signatureUrl, examName, sectionLabel, student,
}: {
  schoolName: string;
  schoolLogoUrl: string | null;
  signatureUrl: string | null;
  examName: string;
  sectionLabel: string;
  student: AdmitCardStudent;
}) {
  return (
    <div className="admit-card rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 overflow-hidden print:bg-white! print:text-gray-900! print:rounded-none! print:border-gray-300! print:break-inside-avoid">
      <div className="flex items-center gap-3 border-b-2 border-gray-800 dark:border-zinc-600 px-5 py-3 print:border-gray-800!">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-300 dark:border-zinc-600 print:border-gray-300!">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={schoolLogoUrl} alt={schoolName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{initials(schoolName)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wide truncate">{schoolName}</p>
          <p className="text-[10px] text-gray-600 dark:text-zinc-400 print:text-gray-600!">Admit Card · {examName}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 print:border-gray-300! print:bg-gray-50!">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-400 dark:text-zinc-500">{initials(student.name)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{student.name}</p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 print:text-gray-600! flex items-center gap-1"><Hash className="h-3 w-3" />Roll {student.rollNo} · {sectionLabel}</p>
          </div>
        </div>

        <div className="rounded border border-gray-300 dark:border-zinc-700 print:border-gray-300! overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {["Subject", "Date", "Time", "Room"].map((h) => (
                  <th key={h} className="px-3 py-1.5 text-left font-semibold uppercase tracking-wide text-[10px] border-b border-gray-300 dark:border-zinc-700 print:border-gray-300!">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 print:divide-gray-200!">
              {student.schedule.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-3 py-1.5 font-medium">{slot.subjectName}</td>
                  <td className="px-3 py-1.5 text-gray-700 dark:text-zinc-300 print:text-gray-700! whitespace-nowrap">{formatDate(slot.examDate)}</td>
                  <td className="px-3 py-1.5 text-gray-700 dark:text-zinc-300 print:text-gray-700! whitespace-nowrap">{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</td>
                  <td className="px-3 py-1.5 text-gray-700 dark:text-zinc-300 print:text-gray-700!">{slot.room ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{slot.room}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-gray-500 dark:text-zinc-500 print:text-gray-500!">
          Report 15 minutes before the reporting time. Bring this admit card and your school ID card.
        </p>

        <div className="flex items-end justify-between pt-3 border-t border-gray-200 dark:border-zinc-700 print:border-gray-200!">
          <div className="text-center">
            <div className="h-8 w-28 border-b border-gray-400 dark:border-zinc-600 print:border-gray-400!" />
            <p className="text-[9px] text-gray-500 dark:text-zinc-500 print:text-gray-500! mt-0.5">Class Teacher</p>
          </div>
          <div className="text-center">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signatureUrl} alt="Principal's signature" className="h-8 w-28 object-contain object-bottom" />
            ) : (
              <div className="h-8 w-28 border-b border-gray-400 dark:border-zinc-600 print:border-gray-400!" />
            )}
            <p className="text-[9px] text-gray-500 dark:text-zinc-500 print:text-gray-500! mt-0.5">Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdmitCardsClient({
  schoolName, schoolLogoUrl, signatureUrl, examName, sectionLabel, students,
}: {
  schoolName: string;
  schoolLogoUrl: string | null;
  signatureUrl: string | null;
  examName: string;
  sectionLabel: string;
  students: AdmitCardStudent[];
}) {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Admit Cards</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{schoolName} · {sectionLabel} · {examName} · {students.length} students</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 px-3 text-sm text-white transition-colors"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </button>
      </div>

      {students.length === 0 ? (
        <div className="print:hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No students in this section</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-2 print:gap-3">
          {students.map((st) => (
            <AdmitCard
              key={st.id}
              schoolName={schoolName}
              schoolLogoUrl={schoolLogoUrl}
              signatureUrl={signatureUrl}
              examName={examName}
              sectionLabel={sectionLabel}
              student={st}
            />
          ))}
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}
