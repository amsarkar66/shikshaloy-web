"use client";

import { Printer } from "lucide-react";

export interface QrSheetStudent {
  id: string;
  name: string;
  rollNo: string;
  qrDataUrl: string;
}

export default function QrSheetClient({
  schoolName, sectionLabel, students,
}: {
  schoolName: string;
  sectionLabel: string;
  students: QrSheetStudent[];
}) {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">ID Card QR Sheet</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            {schoolName} · {sectionLabel} · {students.length} students · same code as each student&apos;s ID card
          </p>
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
          <p className="text-sm text-gray-400 dark:text-zinc-500">No students in this section yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
          {students.map((s) => (
            <div key={s.id} className="qr-card flex flex-col items-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-center print:border-black print:break-inside-avoid">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500 print:text-black">{schoolName}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.qrDataUrl} alt={`Attendance QR for ${s.name}`} className="h-28 w-28" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 print:text-black truncate w-full">{s.name}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 print:text-black">{sectionLabel} · Roll {s.rollNo}</p>
            </div>
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
