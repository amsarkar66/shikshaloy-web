import { CalendarDays } from "lucide-react";
import { DAYS, subjectStyle, DEFAULT_STYLE, type ClassTimetable, type RowItem } from "../_data/timetable";

function todayDayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? -1 : d - 1;
}

function SlotCell({ subject, name, teacher, room }: { subject: string; name: string; teacher: string; room: string }) {
  const style = subject ? subjectStyle(subject) : DEFAULT_STYLE;
  return (
    <div className={`h-full border-l-2 ${style.border} ${style.bg} rounded-r-md px-2 py-1.5`}>
      <p className={`text-[11px] font-semibold leading-tight ${style.text}`}>{name}</p>
      <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">{teacher}</p>
      <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">{room}</p>
    </div>
  );
}

export function StudentTimetableGrid({ tt, rowItems, classLabel, title, action }: { tt: ClassTimetable; rowItems: RowItem[]; classLabel: string; title?: string; action?: React.ReactNode }) {
  const todayIdx = todayDayIndex();
  const hasAnySlot = Object.values(tt).some((day) => Object.keys(day).length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">{title ?? `Class ${classLabel} — Weekly Schedule`}</p>
        </div>
        {action}
      </div>

      {!hasAnySlot ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 py-24">
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Timetable not configured yet</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Check back once your school sets up the weekly schedule.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50">
          <table className="w-full text-sm border-collapse" style={{ minWidth: 780 }}>
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <th className="w-16 py-3 px-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 whitespace-nowrap">Period</th>
                <th className="w-20 py-3 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 whitespace-nowrap">Time</th>
                {DAYS.map((day, i) => (
                  <th key={day} className={`py-3 px-2 text-center text-xs font-semibold tracking-wide transition-colors ${i === todayIdx ? "text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-zinc-300"}`}>
                    <span className="inline-flex items-center gap-1">
                      {day}
                      {i === todayIdx && <span className="h-1.5 w-1.5 rounded-full bg-primary-500 inline-block" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowItems.map((row, ri) => {
                if (row.type === "break") {
                  return (
                    <tr key={`break-${ri}`} className="bg-gray-50/70 dark:bg-zinc-800/40">
                      <td colSpan={8} className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{row.label}</span>
                          <span className="text-[10px] text-gray-300 dark:text-zinc-600">{row.time}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }
                const p = row.period;
                return (
                  <tr key={p.num} className="border-t border-gray-100 dark:border-zinc-700/50">
                    <td className="py-2 px-3 align-top">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 text-xs font-bold text-gray-600 dark:text-zinc-300">{p.num}</span>
                    </td>
                    <td className="py-2 px-2 align-top whitespace-nowrap">
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-tight">{p.start}</p>
                      <p className="text-[10px] text-gray-300 dark:text-zinc-600 leading-tight">{p.end}</p>
                    </td>
                    {DAYS.map((day, di) => {
                      const slot = tt[day]?.[p.num];
                      return (
                        <td key={day} className={`py-1.5 px-1.5 align-top ${di === todayIdx ? "bg-primary-50/40 dark:bg-primary-500/5" : ""}`} style={{ minWidth: 110 }}>
                          {slot ? <SlotCell {...slot} /> : <div className="h-full min-h-[52px] rounded-md border border-dashed border-gray-200 dark:border-zinc-700/50" />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
