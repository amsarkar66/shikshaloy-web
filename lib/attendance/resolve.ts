import { supabaseAdmin } from "@/lib/supabase/service";

export type AttendanceSource = "manual" | "qr" | "rfid" | "biometric";
export type AttendanceEvent = "in" | "out";
export type CredentialMethod = "rfid" | "biometric";

export type ResolvedPerson =
  | { kind: "student"; id: string }
  | { kind: "staff"; id: string };

/** Looks up who an RFID card UID or biometric external ID belongs to, within a school. */
export async function resolveCredential(
  schoolId: string,
  method: CredentialMethod,
  externalId: string,
): Promise<ResolvedPerson | null> {
  const { data } = await supabaseAdmin
    .from("attendance_credentials")
    .select("student_id, staff_id")
    .eq("school_id", schoolId)
    .eq("method", method)
    .eq("external_id", externalId)
    .maybeSingle();

  if (!data) return null;
  if (data.student_id) return { kind: "student", id: data.student_id };
  if (data.staff_id) return { kind: "staff", id: data.staff_id };
  return null;
}

interface MarkAttendanceEventInput {
  schoolId: string;
  person: ResolvedPerson;
  date: string;
  event: AttendanceEvent;
  source: AttendanceSource;
  deviceId?: string | null;
}

/**
 * Records a check-in/check-out tap from QR, RFID, or biometric intake.
 * First "in" tap of the day sets checked_in_at and marks present; a
 * later "in" tap the same day is a no-op on the timestamp. "out" always
 * refreshes checked_out_at (last tap wins), and creates the row as
 * present if someone checks out without an earlier check-in on file.
 */
export async function markAttendanceEvent(input: MarkAttendanceEventInput): Promise<void> {
  const { schoolId, person, date, event, source, deviceId } = input;
  const table = person.kind === "student" ? "student_attendance" : "staff_attendance";
  const idColumn = person.kind === "student" ? "student_id" : "staff_id";

  const selectCols = person.kind === "student" ? "checked_in_at, section_id" : "checked_in_at";
  const { data: existing } = await supabaseAdmin
    .from(table)
    .select(selectCols)
    .eq(idColumn, person.id)
    .eq("date", date)
    .maybeSingle<{ checked_in_at: string | null; section_id?: string }>();

  const patch: Record<string, unknown> = {
    school_id: schoolId,
    [idColumn]: person.id,
    date,
    source,
    device_id: deviceId ?? null,
  };

  if (!existing) patch.status = "present";
  if (event === "in") {
    if (!existing?.checked_in_at) patch.checked_in_at = new Date().toISOString();
  } else {
    patch.checked_out_at = new Date().toISOString();
  }

  // student_attendance.section_id is NOT NULL — Postgres validates that on
  // every upsert (even one that resolves to the UPDATE branch), so it must
  // be included on every call, not just when the row is first created.
  if (person.kind === "student") {
    let sectionId = existing?.section_id;
    if (!sectionId) {
      const { data: student } = await supabaseAdmin
        .from("students")
        .select("section_id")
        .eq("id", person.id)
        .maybeSingle();
      sectionId = student?.section_id ?? undefined;
    }
    if (!sectionId) throw new Error("Student has no section assigned; cannot record attendance");
    patch.section_id = sectionId;
  }

  const { error } = await supabaseAdmin
    .from(table)
    .upsert(patch, { onConflict: `${idColumn},date` });
  if (error) throw new Error(error.message);
}
