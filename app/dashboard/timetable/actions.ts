"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { DAYS, type Day, type Period } from "./_data/timetable";

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
  teacherId: string | null;
  teacherName: string;
}

export interface SectionTimetableConfig {
  periods: Period[];
  hasPeriods: boolean;
  subjects: SubjectOption[];
  slots: Partial<Record<Day, Partial<Record<number, { subjectId: string; room: string }>>>>;
}

interface SectionSubjectRow {
  subject_id: string;
  teacher_id: string | null;
  subjects: { name: string | null; code: string | null } | null;
  profiles: { full_name: string | null } | null;
}

interface SlotRow {
  subject_id: string | null;
  day_of_week: number;
  period_number: number;
  room: string | null;
}

interface PeriodRow {
  number: number;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
}

export async function getSectionTimetableConfig(sectionId: string): Promise<SectionTimetableConfig> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: section } = await supabaseAdmin
    .from("sections")
    .select("id")
    .eq("id", sectionId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!section) throw new Error("Class not found.");

  const [{ data: periodRows }, { data: ssRows }, { data: slotRows }] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time, is_break")
      .eq("school_id", schoolId)
      .order("start_time"),

    supabaseAdmin
      .from("section_subjects")
      .select("subject_id, teacher_id, subjects ( name, code ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .eq("academic_year_id", academicYearId),

    supabaseAdmin
      .from("timetable_slots")
      .select("subject_id, day_of_week, period_number, room")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .eq("academic_year_id", academicYearId),
  ]);

  const allPeriods = (periodRows ?? []) as unknown as PeriodRow[];
  const periods: Period[] = allPeriods
    .filter((p) => !p.is_break)
    .map((p) => ({ num: p.number, start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) }));

  const subjects: SubjectOption[] = ((ssRows ?? []) as unknown as SectionSubjectRow[])
    .map((ss) => ({
      id: ss.subject_id,
      name: ss.subjects?.name ?? "Subject",
      code: ss.subjects?.code ?? "",
      teacherId: ss.teacher_id,
      teacherName: ss.profiles?.full_name ?? "— No teacher assigned —",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const slots: SectionTimetableConfig["slots"] = {};
  for (const s of (slotRows ?? []) as unknown as SlotRow[]) {
    const day = DAYS[s.day_of_week - 1];
    if (!day || !s.subject_id) continue;
    slots[day] ??= {};
    slots[day]![s.period_number] = { subjectId: s.subject_id, room: s.room ?? "" };
  }

  return { periods, hasPeriods: allPeriods.length > 0, subjects, slots };
}

export interface CreateDefaultPeriodsInput {
  count: number;
  startTime: string; // "HH:MM"
  periodMinutes: number;
  breakAfterPeriod?: number | null;
  breakMinutes?: number | null;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export async function createDefaultPeriods(input: CreateDefaultPeriodsInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { count: existingCount } = await supabaseAdmin
    .from("timetable_periods")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  if (existingCount && existingCount > 0) throw new Error("Periods are already configured for this school.");

  if (!Number.isFinite(input.count) || input.count < 1 || input.count > 15) throw new Error("Enter a valid number of periods (1–15).");
  if (!Number.isFinite(input.periodMinutes) || input.periodMinutes < 10 || input.periodMinutes > 180) throw new Error("Enter a valid period length.");

  const rows: { school_id: string; number: number; start_time: string; end_time: string; is_break: boolean; break_label: string | null }[] = [];
  let time = toMinutes(input.startTime || "08:00");
  let seq = 1;
  for (let i = 1; i <= input.count; i++) {
    const end = time + input.periodMinutes;
    rows.push({ school_id: schoolId, number: seq, start_time: toHHMM(time), end_time: toHHMM(end), is_break: false, break_label: null });
    seq++;
    time = end;
    if (input.breakAfterPeriod === i && input.breakMinutes && input.breakMinutes > 0) {
      const breakEnd = time + input.breakMinutes;
      rows.push({ school_id: schoolId, number: seq, start_time: toHHMM(time), end_time: toHHMM(breakEnd), is_break: true, break_label: "Break" });
      seq++;
      time = breakEnd;
    }
  }

  const { error } = await supabaseAdmin.from("timetable_periods").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/timetable");
}

export interface TimetableSlotInput {
  day: Day;
  periodNumber: number;
  subjectId: string;
  room: string | null;
}

export async function saveSectionTimetable(sectionId: string, entries: TimetableSlotInput[]): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: section } = await supabaseAdmin
    .from("sections")
    .select("id")
    .eq("id", sectionId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!section) throw new Error("Class not found.");

  const { data: ssRows } = await supabaseAdmin
    .from("section_subjects")
    .select("subject_id, teacher_id")
    .eq("school_id", schoolId)
    .eq("section_id", sectionId)
    .eq("academic_year_id", academicYearId);

  const teacherBySubject = new Map((ssRows ?? []).map((ss) => [ss.subject_id, ss.teacher_id as string | null]));

  const { error: deleteError } = await supabaseAdmin
    .from("timetable_slots")
    .delete()
    .eq("school_id", schoolId)
    .eq("section_id", sectionId)
    .eq("academic_year_id", academicYearId);
  if (deleteError) throw new Error(deleteError.message);

  const rows = entries
    .filter((e) => e.subjectId)
    .map((e) => ({
      school_id: schoolId,
      section_id: sectionId,
      subject_id: e.subjectId,
      teacher_id: teacherBySubject.get(e.subjectId) ?? null,
      academic_year_id: academicYearId,
      day_of_week: DAYS.indexOf(e.day) + 1,
      period_number: e.periodNumber,
      room: e.room?.trim() || null,
    }));

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin.from("timetable_slots").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/dashboard/timetable");
}
