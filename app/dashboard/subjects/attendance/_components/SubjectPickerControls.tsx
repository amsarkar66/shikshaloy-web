"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { addDays, formatLong, todayStr } from "../../../attendance/_components/attendance-shared";

export default function SubjectPickerControls({
  subjectId, sections, sectionId, dateStr,
}: {
  subjectId: string;
  sections: { id: string; label: string }[];
  sectionId: string;
  dateStr: string;
}) {
  const router = useRouter();
  const isToday = dateStr === todayStr();

  function go(nextSectionId: string, nextDate: string) {
    router.push(`/dashboard/subjects/attendance?subject=${subjectId}&section=${nextSectionId}&date=${nextDate}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 min-w-0 max-w-xs">
        <select value={sectionId} onChange={(e) => go(e.target.value, dateStr)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
          {sections.map((sec) => <option key={sec.id} value={sec.id}>Class {sec.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => go(sectionId, addDays(dateStr, -1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><ChevronLeft className="h-4 w-4"/></button>
        <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <CalendarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 whitespace-nowrap">{formatLong(dateStr)}</span>
          {isToday && <span className="text-[9px] font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Today</span>}
        </div>
        <button onClick={() => go(sectionId, addDays(dateStr, 1))} disabled={isToday} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-4 w-4"/></button>
      </div>
    </div>
  );
}
