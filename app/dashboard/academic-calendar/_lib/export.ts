import { EVENT_TYPE_CONFIG, type CalendarEvent } from "../_data/academic-calendar";

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- ICS (iCalendar) ---------------------------------------------------

function escapeICSText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// RFC 5545: lines longer than 75 octets must be folded, with continuation
// lines starting with a single space.
function foldLine(line: string) {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n ");
}

function toICSDate(iso: string) {
  return iso.replaceAll("-", "");
}

function addOneDayISO(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildICS(events: CalendarEvent[], calendarName: string) {
  const dtstamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shikshaloy//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
  ];

  events.forEach((ev) => {
    const start = toICSDate(ev.date);
    const endSourceDate = ev.dateTo && ev.dateTo > ev.date ? ev.dateTo : ev.date;
    const end = toICSDate(addOneDayISO(endSourceDate));
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@shikshaloy.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeICSText(ev.title)}`,
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeICSText(ev.description)}`);
    lines.push(`CATEGORIES:${escapeICSText(EVENT_TYPE_CONFIG[ev.type].label)}`, "END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export function downloadICS(events: CalendarEvent[], filename: string, calendarName: string) {
  triggerDownload(buildICS(events, calendarName), filename, "text/calendar;charset=utf-8");
}

// --- CSV -----------------------------------------------------------------

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCSV(events: CalendarEvent[]) {
  const header = ["Date", "End Date", "Title", "Type", "Description", "Applies To"];
  const rows = events.map((ev) => [
    ev.date,
    ev.dateTo && ev.dateTo !== ev.date ? ev.dateTo : "",
    ev.title,
    EVENT_TYPE_CONFIG[ev.type].label,
    ev.description ?? "",
    ev.affectsAll ? "All Classes" : ev.classes ?? "",
  ]);
  return `${[header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n")}\r\n`;
}

export function downloadCSV(events: CalendarEvent[], filename: string) {
  // Leading BOM so Excel recognizes the file as UTF-8.
  triggerDownload(`\uFEFF${buildCSV(events)}`, filename, "text/csv;charset=utf-8");
}
