import { MONTHS, MONTH_KEYS, EVENT_TYPE_CONFIG, type CalendarEvent, type EventType } from "../_data/academic-calendar";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const LEGEND_TYPES: EventType[] = ["holiday", "exam", "event", "ptm", "term", "vacation"];

function MonthTile({ monthKey, monthLabel, events }: { monthKey: string; monthLabel: string; events: CalendarEvent[] }) {
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
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">{monthLabel}</p>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-center text-[6.5px] font-semibold text-gray-400">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const dayEvents = eventsByDay.get(day) ?? [];
          return (
            <div key={i} className="flex flex-col items-center justify-start gap-px py-px">
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] leading-none ${
                  dayEvents.length > 0 ? "font-semibold text-gray-800" : "text-gray-400"
                }`}
              >
                {day}
              </span>
              <span className="flex h-0.5 gap-px">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <span key={idx} className={`h-0.5 w-0.5 rounded-full ${EVENT_TYPE_CONFIG[e.type].dot}`} />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PrintableYearCalendar({
  events, schoolName, academicYearLabel, capturing,
}: {
  events: CalendarEvent[];
  schoolName: string;
  academicYearLabel: string;
  capturing: boolean;
}) {
  const months = MONTH_KEYS.map((mk, i) => ({
    key: mk,
    label: MONTHS[i].split(" ")[0],
    events: events.filter((e) => e.date.startsWith(mk)),
  }));

  return (
    <div
      id="academic-calendar-print-area"
      className={capturing ? "fixed left-0 top-0 z-[-1] bg-white opacity-0" : "hidden"}
    >
      <div style={{ width: "210mm", height: "297mm" }} className="flex flex-col bg-white p-[12mm]">
        <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">{schoolName}</p>
            <p className="mt-1 text-sm font-medium text-indigo-600">Academic Calendar {academicYearLabel}</p>
          </div>
          <p className="text-[10px] text-gray-400">
            Generated {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {LEGEND_TYPES.map((type) => {
            const cfg = EVENT_TYPE_CONFIG[type];
            return (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                <span className="text-[10px] font-medium text-gray-600">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid flex-1 grid-cols-3 grid-rows-4 gap-3">
          {months.map((m) => (
            <MonthTile key={m.key} monthKey={m.key} monthLabel={m.label} events={m.events} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2">
          <p className="text-[9px] text-gray-400">Powered by Shikshaloy</p>
          <p className="text-[9px] text-gray-400">shikshaloy.com</p>
        </div>
      </div>
    </div>
  );
}
