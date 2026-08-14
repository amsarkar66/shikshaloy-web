"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

export async function markStudentAttendance(studentId: string, sectionId: string, date: string, status: "present" | "absent" | "late") {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("student_attendance")
    .upsert(
      { school_id: schoolId, student_id: studentId, section_id: sectionId, date, status },
      { onConflict: "student_id,date" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
}

export async function markStaffAttendance(staffId: string, date: string, status: "present" | "absent" | "late" | "on_leave") {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("staff_attendance")
    .upsert(
      { school_id: schoolId, staff_id: staffId, date, status },
      { onConflict: "staff_id,date" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
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
