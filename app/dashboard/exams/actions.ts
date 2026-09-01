"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { requireRole } from "@/lib/auth/verified-role";

async function requireSchoolAdmin() {
  return requireRole(["admin", "super_admin"]);
}

export interface CreateExamInput {
  name: string;
  type: "unit_test" | "mid_term" | "final";
  startDate: string;
  endDate: string;
}

export async function createExam(input: CreateExamInput): Promise<string> {
  await requireSchoolAdmin();
  if (!input.name.trim()) throw new Error("Exam name is required.");
  if (!input.startDate || !input.endDate) throw new Error("Start and end dates are required.");
  if (input.endDate < input.startDate) throw new Error("End date must be on or after the start date.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data, error } = await supabaseAdmin
    .from("exams")
    .insert({
      school_id: schoolId,
      academic_year_id: academicYearId,
      name: input.name.trim(),
      type: input.type,
      status: "upcoming",
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create exam");

  revalidatePath("/dashboard/exams");
  return data.id;
}

export interface ExamScheduleSlot {
  id: string;
  subjectId: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

export async function listExamSchedule(examId: string): Promise<ExamScheduleSlot[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("exam_schedules")
    .select("id, subject_id, exam_date, start_time, end_time, room, subjects ( name )")
    .eq("exam_id", examId)
    .eq("school_id", schoolId)
    .order("exam_date")
    .order("start_time");

  return (data ?? []).map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    subjectName: (r.subjects as unknown as { name: string | null } | null)?.name ?? "Subject",
    examDate: r.exam_date,
    startTime: r.start_time,
    endTime: r.end_time,
    room: r.room,
  }));
}

export interface SaveScheduleSlotInput {
  examId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export async function saveExamScheduleSlot(input: SaveScheduleSlotInput): Promise<void> {
  await requireSchoolAdmin();
  if (!input.subjectId) throw new Error("Choose a subject.");
  if (!input.examDate) throw new Error("Choose a date.");
  if (!input.startTime || !input.endTime) throw new Error("Set a start and end time.");
  if (input.endTime <= input.startTime) throw new Error("End time must be after start time.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("exam_schedules")
    .upsert(
      {
        school_id: schoolId,
        exam_id: input.examId,
        subject_id: input.subjectId,
        exam_date: input.examDate,
        start_time: input.startTime,
        end_time: input.endTime,
        room: input.room?.trim() || null,
      },
      { onConflict: "exam_id,subject_id" },
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/exams/${input.examId}/timetable`);
  revalidatePath(`/dashboard/exams/${input.examId}/admit-cards`);
}

export async function deleteExamScheduleSlot(id: string, examId: string): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("exam_schedules")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/exams/${examId}/timetable`);
  revalidatePath(`/dashboard/exams/${examId}/admit-cards`);
}

// ── Exam Preference: per-student elective subject choices ──────────────────
// Subjects flagged `type = 'elective'` are offered to a whole section via
// section_subjects, but not every student in that section takes the same
// one — this records which specific students opted into which elective.

export interface ElectiveOption { sectionSubjectId: string; subjectId: string; subjectName: string }
export interface PreferenceStudent { id: string; name: string; rollNo: string }
export interface SectionPreferenceData {
  electives: ElectiveOption[];
  students: PreferenceStudent[];
  selections: Record<string, string[]>;
  locked: boolean;
}

// Preferences are only editable during the setup window, before any exam
// this academic year has actually started — once an exam is ongoing/done,
// admit cards and gradebooks may already reflect the current choices, so
// flipping a student's subject afterwards would create a mismatch.
async function isPreferenceWindowLocked(schoolId: string, academicYearId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("exams")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .neq("status", "upcoming")
    .limit(1);
  return (data ?? []).length > 0;
}

export async function getSectionPreferenceData(sectionId: string): Promise<SectionPreferenceData> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: ssRows }, { data: studentRows }, locked] = await Promise.all([
    supabaseAdmin
      .from("section_subjects")
      .select("id, subject_id, subjects ( name, type )")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .eq("academic_year_id", academicYearId),
    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .order("roll_no"),
    isPreferenceWindowLocked(schoolId, academicYearId),
  ]);

  const electives: ElectiveOption[] = (ssRows ?? [])
    .filter((r) => (r.subjects as unknown as { type: string | null } | null)?.type === "elective")
    .map((r) => ({
      sectionSubjectId: r.id,
      subjectId: r.subject_id,
      subjectName: (r.subjects as unknown as { name: string | null } | null)?.name ?? "Subject",
    }));

  const electiveIds = electives.map((e) => e.sectionSubjectId);
  const { data: prefRows } = electiveIds.length
    ? await supabaseAdmin
        .from("student_subject_preferences")
        .select("student_id, section_subject_id")
        .in("section_subject_id", electiveIds)
    : { data: [] as { student_id: string; section_subject_id: string }[] };

  const selections: Record<string, string[]> = {};
  for (const r of prefRows ?? []) {
    (selections[r.student_id] ??= []).push(r.section_subject_id);
  }

  return {
    electives,
    students: (studentRows ?? []).map((s) => ({ id: s.id, name: s.full_name ?? "—", rollNo: s.roll_no ?? "" })),
    selections,
    locked,
  };
}

export async function setStudentSubjectPreference(
  studentId: string,
  sectionSubjectId: string,
  enabled: boolean,
): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  if (await isPreferenceWindowLocked(schoolId, academicYearId)) {
    throw new Error("Exam preferences are locked once an exam this academic year has started.");
  }

  if (enabled) {
    const { error } = await supabaseAdmin
      .from("student_subject_preferences")
      .upsert(
        { school_id: schoolId, student_id: studentId, section_subject_id: sectionSubjectId, academic_year_id: academicYearId },
        { onConflict: "student_id,section_subject_id" },
      );
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from("student_subject_preferences")
      .delete()
      .eq("student_id", studentId)
      .eq("section_subject_id", sectionSubjectId)
      .eq("school_id", schoolId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/exams/preferences");
  revalidatePath("/dashboard/grades");
}

// Every section_subject_id a student has opted into, for elective-aware
// roster/subject filtering elsewhere (Gradebook, Admit Cards).
export async function getStudentElectiveSectionSubjectIds(studentIds: string[]): Promise<Record<string, string[]>> {
  if (studentIds.length === 0) return {};
  const { data } = await supabaseAdmin
    .from("student_subject_preferences")
    .select("student_id, section_subject_id")
    .in("student_id", studentIds);

  const byStudent: Record<string, string[]> = {};
  for (const r of data ?? []) (byStudent[r.student_id] ??= []).push(r.section_subject_id);
  return byStudent;
}

// ── Marks Entry Permission: exam-scoped grants on top of the default
// "assigned subject teacher" rule — e.g. authorizing a substitute teacher to
// enter marks for one exam without changing the standing assignment. Actual
// enforcement lives server-side in app/dashboard/grades/actions.ts.

export interface MarksGrantCombo {
  sectionSubjectId: string;
  sectionId: string;
  subjectId: string;
  label: string;
  defaultTeacherName: string | null;
}
export interface MarksGrantOption { profileId: string; name: string }
export interface MarksGrant { id: string; sectionSubjectId: string; staffProfileId: string; staffName: string }

export interface MarksEntryPermissionData {
  combos: MarksGrantCombo[];
  staffOptions: MarksGrantOption[];
  grants: MarksGrant[];
}

export async function listMarksEntryPermissionData(examId: string): Promise<MarksEntryPermissionData> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: ssRows }, { data: staffRows }, { data: grantRows }] = await Promise.all([
    supabaseAdmin
      .from("section_subjects")
      .select("id, section_id, subject_id, sections ( name, grades ( level ) ), subjects ( name ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("status", "active")
      .order("full_name"),
    supabaseAdmin
      .from("marks_entry_grants")
      .select("id, section_subject_id, staff_profile_id, profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("exam_id", examId),
  ]);

  const combos: MarksGrantCombo[] = (ssRows ?? []).map((r) => {
    const section = r.sections as unknown as { name: string | null; grades: { level: number | null } | null } | null;
    const subject = r.subjects as unknown as { name: string | null } | null;
    const teacher = r.profiles as unknown as { full_name: string | null } | null;
    return {
      sectionSubjectId: r.id,
      sectionId: r.section_id,
      subjectId: r.subject_id,
      label: `Class ${section?.grades?.level ?? "?"}-${section?.name ?? ""} · ${subject?.name ?? "Subject"}`,
      defaultTeacherName: teacher?.full_name ?? null,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));

  const staffOptions: MarksGrantOption[] = (staffRows ?? []).map((s) => ({ profileId: s.id, name: s.full_name ?? "—" }));

  const grants: MarksGrant[] = (grantRows ?? []).map((g) => ({
    id: g.id,
    sectionSubjectId: g.section_subject_id,
    staffProfileId: g.staff_profile_id,
    staffName: (g.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "—",
  }));

  return { combos, staffOptions, grants };
}

export async function grantMarksEntryAccess(examId: string, sectionSubjectId: string, staffProfileId: string): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("marks_entry_grants")
    .upsert(
      { school_id: schoolId, exam_id: examId, section_subject_id: sectionSubjectId, staff_profile_id: staffProfileId },
      { onConflict: "exam_id,section_subject_id,staff_profile_id" },
    );
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/exams/${examId}`);
  revalidatePath("/dashboard/grades");
}

export async function revokeMarksEntryAccess(grantId: string, examId: string): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("marks_entry_grants")
    .delete()
    .eq("id", grantId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/exams/${examId}`);
  revalidatePath("/dashboard/grades");
}
