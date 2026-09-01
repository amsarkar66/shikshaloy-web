"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth } from "../_data/payroll";

export default function MonthNav({ months, index, onChange }: { months: string[]; index: number; onChange: (i: number) => void }) {
  const monthStr = months[index] ?? "";
  const isFirst = index <= 0;
  const isLast = index >= months.length - 1;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(index - 1)}
        disabled={isFirst}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 h-8">
        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{monthStr ? formatMonth(monthStr) : "No data"}</span>
        {isLast && monthStr && <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">Latest</span>}
      </div>
      <button
        onClick={() => onChange(index + 1)}
        disabled={isLast}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}
