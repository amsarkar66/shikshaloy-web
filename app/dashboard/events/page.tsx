"use client";

import { useState, useMemo } from "react";
import {
  Calendar, CalendarDays, ChevronLeft, ChevronRight,
  Plus, Download, Clock, MapPin, Users, Sun,
  ClipboardCheck, Trophy, Star, BookOpen, List,
} from "lucide-react";
import {
  ALL_EVENTS, TYPE_LABEL, TYPE_COLOR, TYPE_BADGE, AUDIENCE_LABEL,
  getEventsForDate, formatEventDateRange, formatDate, formatTime, countDays,
  type SchoolEvent, type EventType,
} from "./_data/events";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number): string { return String(n).padStart(2, "0"); }

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ── Event type styles ─────────────────────────────────────────────────────────

// TYPE_COLOR and TYPE_BADGE come from the data file

const TYPE_PILL: Record<EventType, string> = {
  holiday:  "bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-300",
  exam:     "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  meeting:  "bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300",
  sports:   "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  cultural: "bg-pink-100   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300",
  workshop: "bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300",
  other:    "bg-gray-100   dark:bg-zinc-700      text-gray-700   dark:text-zinc-300",
};

const TYPE_ICON_BG: Record<EventType, string> = {
  holiday:  "bg-red-500/10",
  exam:     "bg-violet-500/10",
  meeting:  "bg-blue-500/10",
  sports:   "bg-emerald-500/10",
  cultural: "bg-pink-500/10",
  workshop: "bg-amber-500/10",
  other:    "bg-gray-100 dark:bg-zinc-700",
};

const TYPE_ICON_COLOR: Record<EventType, string> = {
  holiday:  "text-red-500",
  exam:     "text-violet-500",
  meeting:  "text-blue-500",
  sports:   "text-emerald-500",
  cultural: "text-pink-500",
  workshop: "text-amber-500",
  other:    "text-gray-400",
};

const TYPE_ICON: Record<EventType, React.ElementType> = {
  holiday:  Sun,
  exam:     ClipboardCheck,
  meeting:  Users,
  sports:   Trophy,
  cultural: Star,
  workshop: BookOpen,
  other:    Calendar,
};

const FILTER_TYPES: (EventType | "all")[] = ["all","holiday","exam","meeting","sports","cultural","workshop"];

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const today = todayStr();
  const [ty, tm] = today.split("-");
  const monthStart = `${ty}-${tm}-01`;
  const monthEnd   = `${ty}-${tm}-31`;

  const yearEvents = ALL_EVENTS.filter((e) => e.date >= "2026-04-01" && e.date <= "2027-03-31");
  const thisMonth  = ALL_EVENTS.filter((e) => {
    const end = e.endDate ?? e.date;
    return e.date <= monthEnd && end >= monthStart;
  });
  const upcoming = ALL_EVENTS.filter((e) => (e.endDate ?? e.date) >= today);
  const holidays = yearEvents.filter((e) => e.type === "holiday");

  const items = [
    { label: "Total Events",    value: yearEvents.length, icon: Calendar,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "This Month",      value: thisMonth.length,  icon: CalendarDays,  accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Upcoming",        value: upcoming.length,   icon: Clock,         accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Holidays (Year)", value: holidays.length,   icon: Sun,           accent: "text-amber-500   bg-amber-500/10"   },
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

// ── Day panel ─────────────────────────────────────────────────────────────────

function DayPanel({ dateStr }: { dateStr: string }) {
  const today   = todayStr();
  const isToday = dateStr === today;
  const events  = useMemo(() => getEventsForDate(dateStr), [dateStr]);
  const dayLabel = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="w-72 shrink-0 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden flex flex-col">
      <div className={`px-4 py-3.5 border-b border-gray-100 dark:border-zinc-700/50 ${isToday ? "bg-indigo-50 dark:bg-indigo-500/10" : ""}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 leading-tight">{dayLabel}</p>
          {isToday && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          {events.length === 0 ? "No events" : `${events.length} event${events.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-700/50">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14">
            <Calendar className="h-7 w-7 text-gray-200 dark:text-zinc-700" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No events scheduled</p>
          </div>
        ) : (
          events.map((ev) => {
            const Icon = TYPE_ICON[ev.type];
            return (
              <div key={ev.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${TYPE_ICON_BG[ev.type]}`}>
                    <Icon className={`h-3 w-3 ${TYPE_ICON_COLOR[ev.type]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 leading-snug">{ev.title}</p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        {ev.isAllDay
                          ? "All day"
                          : `${formatTime(ev.time!)}${ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}`}
                      </p>
                      {ev.location && (
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex mt-1.5 items-center rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${TYPE_BADGE[ev.type]}`}>
                      {TYPE_LABEL[ev.type]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

function CalendarView() {
  const today = todayStr();
  const [year,         setYear]  = useState(() => new Date().getFullYear());
  const [month,        setMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelected] = useState(today);

  const cells = useMemo(() => {
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();
    const result: { date: string; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const [py, pm] = month === 0 ? [year - 1, 11] : [year, month - 1];
      result.push({ date: `${py}-${pad(pm + 1)}-${pad(d)}`, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, isCurrentMonth: true });
    }
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      const [ny, nm] = month === 11 ? [year + 1, 0] : [year, month + 1];
      result.push({ date: `${ny}-${pad(nm + 1)}-${pad(d)}`, isCurrentMonth: false });
    }
    return result;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, SchoolEvent[]> = {};
    cells.forEach(({ date }) => { map[date] = getEventsForDate(date); });
    return map;
  }, [cells]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }
  function goToToday() {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(today);
  }

  const isThisMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  return (
    <div className="flex gap-4">
      {/* Calendar grid */}
      <div className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">

        {/* Month nav */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-zinc-100">
            {MONTHS[month]} {year}
          </p>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isThisMonth && (
            <button
              onClick={goToToday}
              className="flex h-8 items-center px-3 rounded-lg border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/80">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 border-t border-l border-gray-100 dark:border-zinc-700/50">
          {cells.map(({ date, isCurrentMonth }) => {
            const dayEvents  = eventsByDate[date] ?? [];
            const isToday    = date === today;
            const isSelected = date === selectedDate;
            const dayNum     = parseInt(date.split("-")[2]);
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                className={`min-h-[82px] w-full p-1.5 text-left border-b border-r border-gray-100 dark:border-zinc-700/50 transition-colors
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isSelected && isCurrentMonth ? "bg-indigo-50/70 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-zinc-700/20"}
                `}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                  ${isToday ? "bg-indigo-500 text-white" : "text-gray-700 dark:text-zinc-300"}
                `}>
                  {dayNum}
                </span>
                <div className="mt-1 space-y-px">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`truncate text-[10px] font-medium rounded px-1 py-px ${TYPE_PILL[ev.type]}`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 px-0.5">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-700/50 flex flex-wrap gap-x-4 gap-y-1.5">
          {(["holiday","exam","meeting","sports","cultural","workshop"] as EventType[]).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full shrink-0 ${TYPE_COLOR[t]}`} />
              <span className="text-[10px] text-gray-500 dark:text-zinc-400">{TYPE_LABEL[t]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day panel */}
      <DayPanel dateStr={selectedDate} />
    </div>
  );
}

// ── Event card (list view) ────────────────────────────────────────────────────

function EventCard({ event }: { event: SchoolEvent }) {
  const Icon        = TYPE_ICON[event.type];
  const isMultiDay  = event.endDate && event.endDate !== event.date;
  const dayCount    = isMultiDay ? countDays(event.date, event.endDate!) : 1;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TYPE_ICON_BG[event.type]}`}>
        <Icon className={`h-5 w-5 ${TYPE_ICON_COLOR[event.type]}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{event.title}</h3>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[event.type]}`}>
            {TYPE_LABEL[event.type]}
          </span>
          {isMultiDay && (
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400">
              {dayCount} days
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            {formatEventDateRange(event)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {event.isAllDay
              ? "All day"
              : `${formatTime(event.time!)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500 line-clamp-1">{event.description}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {event.audience.map((a) => (
            <span key={a} className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
              {AUDIENCE_LABEL[a]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function ListView() {
  const today = todayStr();
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [page,       setPage]       = useState(1);

  const timeFiltered = useMemo(() => ALL_EVENTS.filter((e) => {
    const end = e.endDate ?? e.date;
    if (timeFilter === "upcoming") return end >= today;
    if (timeFilter === "past")     return end < today;
    return true;
  }), [timeFilter, today]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: timeFiltered.length };
    timeFiltered.forEach((e) => { c[e.type] = (c[e.type] ?? 0) + 1; });
    return c;
  }, [timeFiltered]);

  const filtered = useMemo(() => {
    return timeFiltered
      .filter((e) => typeFilter === "all" || e.type === typeFilter)
      .sort((a, b) => timeFilter === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [timeFiltered, typeFilter, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleType(t: EventType | "all") { setTypeFilter(t); setPage(1); }
  function handleTime(t: "upcoming" | "past" | "all") { setTimeFilter(t); setPage(1); }

  return (
    <div className="space-y-4">
      {/* Time filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
          {(["upcoming","all","past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTime(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                timeFilter === t
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t === "upcoming" ? "Upcoming" : t === "past" ? "Past" : "All Events"}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TYPES.map((t) => {
          const count = t === "all" ? typeCounts.all : (typeCounts[t] ?? 0);
          return (
            <button
              key={t}
              onClick={() => handleType(t)}
              className={`flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {t === "all" ? "All" : TYPE_LABEL[t]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                typeFilter === t ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500 dark:text-zinc-500">
        Showing{" "}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span>{" "}
        event{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Events */}
      {pageData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <Calendar className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No events match this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pageData.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 pt-3">
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, i, arr) => {
                if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "…" ? (
                  <span key={`e-${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === n
                        ? "bg-indigo-500 text-white"
                        : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "calendar" | "list";

export default function EventsPage() {
  const [tab, setTab] = useState<Tab>("calendar");

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Events &amp; Calendar</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">School events, holidays, and schedule for 2026-27</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors">
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* View toggle */}
      <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 w-fit">
        {(["calendar","list"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            {t === "calendar" ? <CalendarDays className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
            {t === "calendar" ? "Calendar" : "List"}
          </button>
        ))}
      </div>

      {tab === "calendar" ? <CalendarView /> : <ListView />}
    </div>
  );
}
