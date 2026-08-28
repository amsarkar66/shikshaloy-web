// Server fetches this many days up front; the client-side range dropdown
// slices down from it, so switching ranges never needs a refetch.
export const TREND_DAYS = 90;

// Builds a fixed-length daily attendance-rate series (oldest → newest, today
// included) from raw status rows, so the Overview trend chart always has one
// bar per day even on days nothing was marked yet. rate is null (not 0) for
// a day with no attendance rows at all, so the chart can tell "nobody showed
// up" apart from "nobody took attendance".
export function buildAttendanceTrend(rows: { date: string; status: string }[], totalEnrolled: number): { date: string; rate: number | null }[] {
  const byDate = new Map<string, { present: number; late: number }>();
  for (const r of rows) {
    const entry = byDate.get(r.date) ?? { present: 0, late: 0 };
    if (r.status === "present") entry.present += 1;
    if (r.status === "late") entry.late += 1;
    byDate.set(r.date, entry);
  }

  const days: { date: string; rate: number | null }[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = byDate.get(dateStr);
    const rate = entry && totalEnrolled > 0 ? Math.round(((entry.present + entry.late) / totalEnrolled) * 100) : null;
    days.push({ date: dateStr, rate });
  }
  return days;
}
