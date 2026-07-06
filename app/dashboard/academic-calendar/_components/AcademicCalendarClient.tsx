"use client";

import { useState } from "react";
import {
  CalendarRange, Sun, ClipboardCheck, Sparkles, Download, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  MONTHS, MONTH_KEYS, EVENT_TYPE_CONFIG, formatDate,
  type EventType, type CalendarEvent,
} from "../_data/academic-calendar";

export type { CalendarEvent };

function StatsRow({ events }: { events: CalendarEvent[] }) {
  const workingDays = 220;
  const holidays    = events.filter((e) => e.type === "holiday").length;
  const examDays    = events.filter((e) => e.type === "exam").length;
  const eventsAndPTMs = events.filter((e) => e.type === "event" || e.type === "ptm").length;
  const items = [
    { label: "Working Days",  value: workingDays,  icon: CalendarRange,  accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Holidays",      value: holidays,     icon: Sun,            accent: "text-red-500     bg-red-500/10"     },
    { label: "Exam Days",     value: examDays,     icon: ClipboardCheck, accent: "text-violet-500  bg-violet-500/10"  },
    { label: "Events & PTMs", value: eventsAndPTMs,icon: Sparkles,       accent: "text-amber-500   bg-amber-500/10"   },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5"/></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

const LEGEND_TYPES: EventType[] = ["holiday", "exam", "event", "ptm", "term", "vacation"];

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {LEGEND_TYPES.map((type) => {
        const cfg = EVENT_TYPE_CONFIG[type];
        return (
          <span key={type} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`}/> {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

function MonthBlock({ monthKey, monthLabel, events }: { monthKey: string; monthLabel: string; events: CalendarEvent[] }) {
  const [open, setOpen] = useState(true);
  const isCurrentMonth  = monthKey === new Date().toISOString().slice(0, 7);
  return (
    <div className={`rounded-xl border bg-white dark:bg-zinc-800/50 overflow-hidden ${isCurrentMonth?"border-indigo-300 dark:border-indigo-500/40":"border-gray-200 dark:border-zinc-800"}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
        <div className="flex items-center gap-3">
          <p className={`text-sm font-bold ${isCurrentMonth?"text-indigo-600 dark:text-indigo-400":"text-gray-900 dark:text-zinc-50"}`}>{monthLabel}</p>
          {isCurrentMonth&&<span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Current</span>}
          <span className="rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-zinc-400">{events.length} {events.length===1?"entry":"entries"}</span>
        </div>
        {open?<ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-500 shrink-0"/>:<ChevronRight className="h-4 w-4 text-gray-400 dark:text-zinc-500 shrink-0"/>}
      </button>
      {open&&(
        <div className="border-t border-gray-100 dark:border-zinc-700/50 divide-y divide-gray-100 dark:divide-zinc-700/30">
          {events.length===0?(
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-zinc-500 italic">No events this month</p>
          ):events.map((ev) => {
            const cfg = EVENT_TYPE_CONFIG[ev.type];
            return (
              <div key={ev.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-zinc-700/20 transition-colors">
                <div className="w-24 shrink-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(ev.date)}</p>
                  {ev.dateTo&&ev.dateTo!==ev.date&&<p className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">→ {formatDate(ev.dateTo)}</p>}
                </div>
                <div className="mt-1.5 shrink-0"><span className={`block h-2.5 w-2.5 rounded-full ${cfg.dot}`}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{ev.title}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                    {!ev.affectsAll&&ev.classes&&<span className="text-[10px] text-gray-400 dark:text-zinc-500">{ev.classes}</span>}
                  </div>
                  {ev.description&&<p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{ev.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TYPE_TABS: { id: "all"|EventType; label: string }[] = [
  { id: "all",      label: "All"       },
  { id: "holiday",  label: "Holidays"  },
  { id: "exam",     label: "Exams"     },
  { id: "event",    label: "Events"    },
  { id: "ptm",      label: "PTMs"      },
  { id: "vacation", label: "Vacations" },
];

export default function AcademicCalendarClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const [typeFilter, setTypeFilter] = useState<"all"|EventType>("all");

  function getMonthEventsLocal(mk: string) {
    return initialEvents.filter((e) => e.date.startsWith(mk));
  }

  const filteredMonthKeys = MONTH_KEYS.map((mk, i) => ({
    key: mk,
    label: MONTHS[i],
    events: getMonthEventsLocal(mk).filter((e) => typeFilter==="all"||e.type===typeFilter),
  })).filter((m) => m.events.length>0||typeFilter==="all");

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Academic Calendar</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Academic year 2026–27 · April 2026 – March 2027</p>
        </div>
        <button className="sm:ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5"/> Export Calendar
        </button>
      </div>

      <StatsRow events={initialEvents}/>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 w-fit">
          {TYPE_TABS.map(({id,label}) => (
            <button key={id} onClick={()=>setTypeFilter(id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter===id?"bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-50 shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}>{label}</button>
          ))}
        </div>
        <Legend/>
      </div>

      <div className="space-y-3">
        {filteredMonthKeys.map(({key,label,events}) => (
          <MonthBlock key={key} monthKey={key} monthLabel={label} events={events}/>
        ))}
      </div>
    </div>
  );
}
