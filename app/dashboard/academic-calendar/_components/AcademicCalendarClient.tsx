"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarRange, Sun, ClipboardCheck, Sparkles, Download, ChevronDown, ChevronRight,
  List, LayoutGrid, Info,
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

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOutside();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onOutside]);
}

const LEGEND_TYPES: EventType[] = ["holiday", "exam", "event", "ptm", "term", "vacation"];

function Legend() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative flex p-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 w-fit">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="About calendar event types"
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
      >
        <Info className="h-3.5 w-3.5"/>
      </button>
      {open&&(
        <div role="dialog" className="absolute z-50 top-full left-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/5 dark:shadow-black/30 p-3">
          <div className="absolute -top-1 left-3.5 h-2 w-2 rotate-45 border-l border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"/>
          <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 mb-2">Event types</p>
          <div className="space-y-2.5">
            {LEGEND_TYPES.map((type) => {
              const cfg = EVENT_TYPE_CONFIG[type];
              return (
                <div key={type} className="flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`}/>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-zinc-100">{cfg.label}</p>
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400">{cfg.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthBlock({ monthKey, monthLabel, events }: { monthKey: string; monthLabel: string; events: CalendarEvent[] }) {
  const [open, setOpen] = useState(true);
  const isCurrentMonth  = monthKey === new Date().toISOString().slice(0, 7);
  return (
    <div className={`rounded-xl border bg-white dark:bg-zinc-800/50 overflow-hidden ${isCurrentMonth?"border-primary-300 dark:border-primary-500/40":"border-gray-200 dark:border-zinc-800"}`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
        <div className="flex items-center gap-3">
          <p className={`text-sm font-bold ${isCurrentMonth?"text-primary-600 dark:text-primary-400":"text-gray-900 dark:text-zinc-50"}`}>{monthLabel}</p>
          {isCurrentMonth&&<span className="rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400">Current</span>}
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

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function DayTooltip({ dateISO, events, align, onClose }: { dateISO: string; events: CalendarEvent[]; align: "left"|"center"|"right"; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);

  const alignCls = align==="left" ? "left-0" : align==="right" ? "right-0" : "left-1/2 -translate-x-1/2";
  const arrowCls = align==="left" ? "left-3.5" : align==="right" ? "right-3.5" : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={ref}
      role="dialog"
      className={`absolute z-50 top-full ${alignCls} mt-2 w-60 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/5 dark:shadow-black/30 p-3`}
    >
      <div className={`absolute -top-1 ${arrowCls} h-2 w-2 rotate-45 border-l border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800`}/>
      <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 mb-2">
        {new Date(dateISO).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </p>
      <div className="space-y-2.5 max-h-52 overflow-y-auto">
        {events.map((ev) => {
          const cfg = EVENT_TYPE_CONFIG[ev.type];
          return (
            <div key={ev.id} className="flex items-start gap-2">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`}/>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-medium text-gray-900 dark:text-zinc-100">{ev.title}</p>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                </div>
                {ev.description&&<p className="mt-0.5 text-[11px] text-gray-500 dark:text-zinc-400">{ev.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniMonthGrid({ monthKey, monthLabel, events }: { monthKey: string; monthLabel: string; events: CalendarEvent[] }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  const isCurrentMonth = monthKey === todayISO.slice(0, 7);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [yearStr, monthStr] = monthKey.split("-");
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth    = new Date(year, month, 0).getDate();

  const eventsByDay = new Map<number, CalendarEvent[]>();
  events.forEach((ev) => {
    const from = ev.date.startsWith(monthKey) ? parseInt(ev.date.slice(8, 10), 10) : 1;
    const to   = ev.dateTo && ev.dateTo.startsWith(monthKey) ? parseInt(ev.dateTo.slice(8, 10), 10) : from;
    for (let d = Math.min(from, to); d <= Math.max(from, to); d++) {
      if (!eventsByDay.has(d)) eventsByDay.set(d, []);
      eventsByDay.get(d)!.push(ev);
    }
  });

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={`rounded-xl border bg-white dark:bg-zinc-800/50 p-3.5 ${isCurrentMonth?"border-primary-300 dark:border-primary-500/40":"border-gray-200 dark:border-zinc-800"}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <p className={`text-sm font-bold ${isCurrentMonth?"text-primary-600 dark:text-primary-400":"text-gray-900 dark:text-zinc-50"}`}>{monthLabel}</p>
        {isCurrentMonth&&<span className="rounded-full bg-primary-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary-600 dark:text-primary-400">Current</span>}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center text-[9px] font-semibold text-gray-400 dark:text-zinc-500">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day===null) return <span key={i}/>;
          const dateISO    = `${monthKey}-${String(day).padStart(2, "0")}`;
          const dayEvents  = eventsByDay.get(day) ?? [];
          const isToday    = dateISO === todayISO;
          const hasEvents  = dayEvents.length>0;
          const isSelected = selectedDay === day;
          const dayOfWeek  = i % 7;
          const align: "left"|"center"|"right" = dayOfWeek<=1 ? "left" : dayOfWeek>=5 ? "right" : "center";
          return (
            <div key={i} className="relative flex flex-col items-center justify-start gap-0.5 py-0.5">
              <button
                type="button"
                disabled={!hasEvents}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] leading-none transition-colors ${hasEvents?"cursor-pointer":"cursor-default"} ${isToday?"bg-primary-500 text-white font-bold":isSelected?"ring-1 ring-primary-400 bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold":hasEvents?"font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700":"text-gray-500 dark:text-zinc-400"}`}
              >
                {day}
              </button>
              <span className="flex h-1 gap-0.5">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <span key={idx} className={`h-1 w-1 rounded-full ${EVENT_TYPE_CONFIG[e.type].dot}`}/>
                ))}
              </span>
              {isSelected&&hasEvents&&(
                <DayTooltip dateISO={dateISO} events={dayEvents} align={align} onClose={() => setSelectedDay(null)}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearGridCalendar({ months }: { months: { key: string; label: string; events: CalendarEvent[] }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {months.map((m) => (
        <MiniMonthGrid key={m.key} monthKey={m.key} monthLabel={m.label} events={m.events}/>
      ))}
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
  const [viewMode, setViewMode] = useState<"list"|"grid">("list");

  function getMonthEventsLocal(mk: string) {
    return initialEvents.filter((e) => e.date.startsWith(mk));
  }

  const monthsWithFilteredEvents = MONTH_KEYS.map((mk, i) => ({
    key: mk,
    label: MONTHS[i],
    events: getMonthEventsLocal(mk).filter((e) => typeFilter==="all"||e.type===typeFilter),
  }));

  const filteredMonthKeys = monthsWithFilteredEvents.filter((m) => m.events.length>0||typeFilter==="all");

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
        <div className="sm:ml-auto flex gap-0.5 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 w-fit">
          <button
            onClick={()=>setViewMode("list")}
            aria-label="List view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode==="list"?"bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-50 shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}
          >
            <List className="h-3.5 w-3.5"/>
          </button>
          <button
            onClick={()=>setViewMode("grid")}
            aria-label="Yearly grid view"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode==="grid"?"bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-50 shadow-sm":"text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5"/>
          </button>
        </div>
      </div>

      {viewMode==="grid"?(
        <YearGridCalendar months={monthsWithFilteredEvents}/>
      ):(
        <div className="space-y-3">
          {filteredMonthKeys.map(({key,label,events}) => (
            <MonthBlock key={key} monthKey={key} monthLabel={label} events={events}/>
          ))}
        </div>
      )}
    </div>
  );
}
