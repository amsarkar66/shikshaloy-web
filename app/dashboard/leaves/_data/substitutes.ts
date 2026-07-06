export interface Period {
  day: string;
  period: number;
  time: string;
  classSection: string;
  subject: string;
}

export const AVAILABLE_TEACHERS = [
  "Seema Joshi", "Pooja Tiwari", "Deepak Singh", "Mohan Iyer",
  "Arjun Patil", "Neha Gupta", "Meena Das", "Ravi Shankar",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["8:00–8:45", "8:50–9:35", "9:40–10:25", "10:45–11:30", "11:35–12:20", "12:55–1:40"];
const CLASS_SECTIONS = ["6-A", "7-B", "8-A", "9-B", "10-A"];

/** Deterministic mock timetable slots affected by a teacher's leave, so the same leave always produces the same plan. */
export function generateAffectedPeriods(leaveId: string, department: string, from: string, to: string): Period[] {
  const seed = leaveId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  const dayCount = Math.max(1, Math.min(5, Math.round((end - start) / 86_400_000) + 1));

  const periods: Period[] = [];
  for (let d = 0; d < dayCount; d++) {
    const periodsPerDay = 1 + ((seed + d) % 3); // 1–3 periods/day
    for (let p = 0; p < periodsPerDay; p++) {
      const idx = (seed + d * 3 + p) % TIMES.length;
      periods.push({
        day: DAYS[d % DAYS.length],
        period: idx + 1,
        time: TIMES[idx],
        classSection: CLASS_SECTIONS[(seed + d + p) % CLASS_SECTIONS.length],
        subject: department,
      });
    }
  }
  return periods;
}
