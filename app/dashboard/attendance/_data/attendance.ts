import { ALL_STUDENTS, type Student } from "../../students/_data/students";
import { ALL_SECTIONS, type ClassSection } from "../../classes/_data/classes";
import { ALL_STAFF, type StaffMember } from "../../staff/_data/staff";

export type AttendanceStatus = "present" | "absent" | "late";

export interface SectionDay {
  sectionId: string;
  present:   number;
  absent:    number;
  late:      number;
  rate:      number; // (present+late)/enrolled × 100
}

// ── Deterministic pseudo-random helpers ───────────────────────────────────────

function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function dateHash(dateStr: string): number {
  return dateStr.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
}

// ── Per-section daily aggregate ───────────────────────────────────────────────

export function getSectionDay(sec: ClassSection, dateStr: string): SectionDay {
  const seed     = sec.id.charCodeAt(0) * 31 + sec.id.charCodeAt(2) * 17 + dateHash(dateStr);
  const variance = Math.round((lcg(seed) - 0.5) * 8);          // ±4 from avg
  const rate     = Math.min(99, Math.max(60, sec.avgAttendance + variance));
  const absent   = Math.round(sec.enrolled * (100 - rate) / 100);
  const late     = Math.floor(lcg(seed + 1) * 3);               // 0–2
  const present  = Math.max(0, sec.enrolled - absent - late);
  return {
    sectionId: sec.id,
    present,
    absent:  Math.max(0, absent),
    late:    Math.max(0, late),
    rate:    Math.round(((present + late) / sec.enrolled) * 100),
  };
}

// ── Per-student daily status ──────────────────────────────────────────────────
// Weighted by each student's overall attendance so chronic absentees stay consistent.

export function getStudentStatus(student: Student, dateStr: string): AttendanceStatus {
  const seed = student.id * 37 + dateHash(dateStr) * 3;
  const rng  = lcg(seed) * 100;
  if (rng < student.attendance - 8) return "present";
  if (rng < student.attendance - 3) return "late";
  return "absent";
}

// ── Section student list ──────────────────────────────────────────────────────

export function getSectionStudents(sectionId: string): Student[] {
  const [cls, sec] = sectionId.split("-");
  return ALL_STUDENTS.filter((s) => s.class === cls && s.section === sec);
}

// ── School-wide daily totals ──────────────────────────────────────────────────

export function getSchoolDay(dateStr: string) {
  const days = ALL_SECTIONS.map((s) => getSectionDay(s, dateStr));
  const present = days.reduce((a, d) => a + d.present, 0);
  const absent  = days.reduce((a, d) => a + d.absent,  0);
  const late    = days.reduce((a, d) => a + d.late,    0);
  const total   = present + absent + late;
  return { present, absent, late, rate: Math.round(((present + late) / total) * 100) };
}

export { ALL_SECTIONS };

// ── Staff attendance ──────────────────────────────────────────────────────────

export type StaffAttendanceStatus = "present" | "absent" | "late" | "on_leave";

// Staff on approved leave get "on_leave" (locked). Active staff get seeded daily status.
export function getStaffMemberStatus(staff: StaffMember, dateStr: string): StaffAttendanceStatus {
  if (staff.status === "on_leave") return "on_leave";
  const seed = staff.id * 53 + dateHash(dateStr) * 7;
  const rng  = lcg(seed) * 100;
  if (rng < 88) return "present";
  if (rng < 94) return "late";
  return "absent";
}

export function getStaffDay(dateStr: string) {
  const active = ALL_STAFF.filter((s) => s.status !== "inactive");
  const statuses = active.map((s) => getStaffMemberStatus(s, dateStr));
  return {
    present: statuses.filter((s) => s === "present").length,
    absent:  statuses.filter((s) => s === "absent").length,
    late:    statuses.filter((s) => s === "late").length,
    onLeave: statuses.filter((s) => s === "on_leave").length,
  };
}

export { ALL_STAFF };
export type { StaffMember };
