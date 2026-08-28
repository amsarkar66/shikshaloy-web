"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getTeacherContext } from "@/lib/teachers/context";
import { logAuditEvent } from "@/lib/audit/log";
import { markAttendanceEvent, resolveCredential } from "@/lib/attendance/resolve";

// ── Authorization ────────────────────────────────────────────────────────────
// Attendance can be marked by: admin/super_admin (any student or staff member
// in the school), or a teacher (only students in a section they teach or are
// class teacher of). Everyone else — students, parents, drivers — can view
// attendance but never write it.

interface MarkerContext {
  role: "admin" | "super_admin" | "teacher";
  teacherSectionIds: string[] | null; // null = unrestricted (admin/super_admin)
}

async function requireAttendanceMarker(): Promise<MarkerContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (!user) throw new Error("Unauthorized");
  if (role === "admin" || role === "super_admin") return { role, teacherSectionIds: null };

  if (role === "teacher") {
    const teacher = await getTeacherContext(user.id);
    if (!teacher) throw new Error("Unauthorized");
    return { role, teacherSectionIds: teacher.sectionIds };
  }

  throw new Error("Unauthorized");
}

function assertCanMarkSection(marker: MarkerContext, sectionId: string) {
  if (marker.teacherSectionIds && !marker.teacherSectionIds.includes(sectionId)) {
    throw new Error("You can only mark attendance for a class you teach");
  }
}

function assertCanMarkStaff(marker: MarkerContext) {
  if (marker.teacherSectionIds !== null) throw new Error("Only school admins can mark staff attendance");
}

export async function markStudentAttendance(studentId: string, sectionId: string, date: string, status: "present" | "absent" | "late") {
  const marker = await requireAttendanceMarker();
  assertCanMarkSection(marker, sectionId);

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("student_attendance")
    .upsert(
      { school_id: schoolId, student_id: studentId, section_id: sectionId, date, status, source: "manual" },
      { onConflict: "student_id,date" },
    );
  if (error) throw new Error(error.message);

  const { data: student } = await supabaseAdmin.from("students").select("full_name").eq("id", studentId).maybeSingle();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Attendance",
    description: `Marked ${student?.full_name ?? "a student"} as ${status} (${date})`,
  });

  revalidatePath("/dashboard/attendance");
}

export async function markStaffAttendance(staffId: string, date: string, status: "present" | "absent" | "late" | "on_leave") {
  const marker = await requireAttendanceMarker();
  assertCanMarkStaff(marker);

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("staff_attendance")
    .upsert(
      { school_id: schoolId, staff_id: staffId, date, status, source: "manual" },
      { onConflict: "staff_id,date" },
    );
  if (error) throw new Error(error.message);

  const { data: staff } = await supabaseAdmin.from("staff_members").select("full_name").eq("id", staffId).maybeSingle();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Attendance",
    description: `Marked ${staff?.full_name ?? "a staff member"} as ${status} (${date})`,
  });

  revalidatePath("/dashboard/attendance");
}

export interface DayAttendanceSummary { date: string; rate: number | null }

// Combined student+staff attendance rate for every day of a given month, for
// the calendar picker in AttendanceClient. Teachers only see their own
// sections' students (no staff, matching what they're allowed to mark);
// admins/super_admins see the whole school. Days after `todayStr` (the
// caller's local "today", since the server can't know the browser's
// timezone) are returned with rate: null rather than queried.
export async function getMonthAttendanceSummary(year: number, month: number, todayStr: string): Promise<DayAttendanceSummary[]> {
  const marker = await requireAttendanceMarker();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const daysInMonth = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = `${year}-${pad(month)}-01`;
  const last = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const restrictedToSections = marker.teacherSectionIds;

  let studentAttQuery = supabaseAdmin.from("student_attendance").select("date, status").eq("school_id", schoolId).gte("date", first).lte("date", last);
  let studentCountQuery = supabaseAdmin.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId);
  if (restrictedToSections) {
    studentAttQuery = studentAttQuery.in("section_id", restrictedToSections);
    studentCountQuery = studentCountQuery.in("section_id", restrictedToSections);
  }

  const [{ data: studentAttRows }, { count: totalStudents }, staffResult] = await Promise.all([
    studentAttQuery,
    studentCountQuery,
    restrictedToSections
      ? Promise.resolve({ attRows: [] as { date: string; status: string }[], total: 0 })
      : Promise.all([
          supabaseAdmin.from("staff_attendance").select("date, status").eq("school_id", schoolId).gte("date", first).lte("date", last),
          supabaseAdmin.from("staff_members").select("id", { count: "exact", head: true }).eq("school_id", schoolId).neq("status", "inactive"),
        ]).then(([att, count]) => ({ attRows: (att.data ?? []) as { date: string; status: string }[], total: count.count ?? 0 })),
  ]);

  const totalPeople = (totalStudents ?? 0) + staffResult.total;
  const presentByDate = new Map<string, number>();
  const markedDates = new Set<string>();
  for (const r of [...((studentAttRows ?? []) as { date: string; status: string }[]), ...staffResult.attRows]) {
    markedDates.add(r.date);
    if (r.status === "present" || r.status === "late") presentByDate.set(r.date, (presentByDate.get(r.date) ?? 0) + 1);
  }

  const days: DayAttendanceSummary[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad(month)}-${pad(d)}`;
    if (date > todayStr || totalPeople === 0 || !markedDates.has(date)) { days.push({ date, rate: null }); continue; }
    days.push({ date, rate: Math.round(((presentByDate.get(date) ?? 0) / totalPeople) * 100) });
  }
  return days;
}

export async function markTransportAttendance(
  studentId: string,
  routeId: string,
  date: string,
  trip: "morning" | "evening",
  status: "present" | "absent",
) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("transport_attendance")
    .upsert(
      { school_id: schoolId, student_id: studentId, route_id: routeId, academic_year_id: await getCurrentAcademicYearId(), date, trip, status },
      { onConflict: "student_id,date,trip" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
}

export interface QrCheckInResult {
  name: string;
  role: "student" | "staff";
  event: "in" | "out";
  time: string;
}

// The ID card's own QR (see classic-centered-layout.tsx) encodes a link to
// the public student-safety page, e.g. "https://app/s/{studentId}" — that's
// the one QR a student carries, so attendance scanning reads the same code
// rather than requiring a second, separate one.
const SAFETY_PAGE_ID = /\/s\/([0-9a-f-]{36})\/?$/i;
const BARE_UUID = /^[0-9a-f-]{36}$/i;

function extractStudentIdFromScan(scanned: string): string | null {
  const trimmed = scanned.trim();
  const match = trimmed.match(SAFETY_PAGE_ID);
  if (match) return match[1];
  return BARE_UUID.test(trimmed) ? trimmed : null;
}

/** Resolves a scanned student ID-card QR (the public safety-page link) to a student and records the tap. */
export async function checkInByQrToken(scanned: string, event: "in" | "out"): Promise<QrCheckInResult> {
  const marker = await requireAttendanceMarker();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const date = new Date().toISOString().split("T")[0];

  const studentId = extractStudentIdFromScan(scanned);
  if (!studentId) throw new Error("QR code not recognized");

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, full_name, section_id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!student) throw new Error("QR code not recognized");
  if (!student.section_id) throw new Error("Student has no section assigned");

  assertCanMarkSection(marker, student.section_id);
  await markAttendanceEvent({ schoolId, person: { kind: "student", id: student.id }, date, event, source: "qr" });
  revalidatePath("/dashboard/attendance");
  return { name: student.full_name, role: "student", event, time: new Date().toISOString() };
}

/** Resolves a keyboard-wedge RFID reader tap (typed into a focused browser input) and records it. */
export async function checkInByRfidTap(uid: string, event: "in" | "out"): Promise<QrCheckInResult> {
  const marker = await requireAttendanceMarker();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const date = new Date().toISOString().split("T")[0];

  const person = await resolveCredential(schoolId, "rfid", uid.trim());
  if (!person) throw new Error("Card not recognized");

  if (person.kind === "staff") {
    assertCanMarkStaff(marker);
  } else {
    const { data: student } = await supabaseAdmin.from("students").select("section_id").eq("id", person.id).maybeSingle();
    if (!student?.section_id) throw new Error("Student has no section assigned");
    assertCanMarkSection(marker, student.section_id);
  }

  const table = person.kind === "student" ? "students" : "staff_members";
  const { data: row } = await supabaseAdmin.from(table).select("full_name").eq("id", person.id).maybeSingle();

  await markAttendanceEvent({ schoolId, person, date, event, source: "rfid" });
  revalidatePath("/dashboard/attendance");

  return { name: row?.full_name ?? "Unknown", role: person.kind, event, time: new Date().toISOString() };
}
