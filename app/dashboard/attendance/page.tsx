import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import AttendanceClient from "./_components/AttendanceClient";
import type {
  AttendanceSec, AttendanceStudent, AttendanceStaff,
  AttendanceStatus, StaffAttendanceStatus,
} from "./_components/AttendanceClient";

export default async function AttendancePage() {
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: sectionRows },
    { data: studentRows },
    { data: staffRows },
    { data: studentAttRows },
    { data: staffAttRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, grades ( level ), profiles ( full_name )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID)
      .eq("status", "active")
      .order("name"),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, section_id, attendance_pct")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("roll_no"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, designation, department, employee_id, type, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .neq("status", "inactive"),

    supabaseAdmin
      .from("student_attendance")
      .select("student_id, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("date", today),

    supabaseAdmin
      .from("staff_attendance")
      .select("staff_id, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("date", today),
  ]);

  // Count enrolled per section
  const enrolledCount: Record<string, number> = {};
  for (const st of studentRows ?? []) {
    if (st.section_id) enrolledCount[st.section_id] = (enrolledCount[st.section_id] ?? 0) + 1;
  }

  const sections: AttendanceSec[] = (sectionRows ?? []).map((s: any) => ({
    id:       s.id,
    classNum: String(s.grades?.level ?? "?"),
    section:  s.name ?? "",
    teacher:  s.profiles?.full_name ?? "",
    room:     s.room ?? "",
    enrolled: enrolledCount[s.id] ?? 0,
  })).sort((a, b) => +a.classNum - +b.classNum || a.section.localeCompare(b.section));

  // Group students by section
  const studentsBySection: Record<string, AttendanceStudent[]> = {};
  for (const st of studentRows ?? []) {
    if (!st.section_id) continue;
    if (!studentsBySection[st.section_id]) studentsBySection[st.section_id] = [];
    studentsBySection[st.section_id].push({
      id:         st.id,
      name:       st.full_name ?? "Unknown",
      rollNo:     st.roll_no ?? "",
      attendance: Math.round(Number(st.attendance_pct ?? 0)),
    });
  }

  const staff: AttendanceStaff[] = (staffRows ?? []).map((s: any) => ({
    id:          s.id,
    name:        s.full_name ?? "",
    designation: s.designation ?? "",
    department:  s.department ?? "",
    employeeId:  s.employee_id ?? "",
    type:        (s.type ?? "teaching") as AttendanceStaff["type"],
    status:      s.status ?? "active",
  }));

  // Build today's attendance maps
  const todayAttendance: Record<string, AttendanceStatus> = {};
  for (const r of studentAttRows ?? []) {
    todayAttendance[r.student_id] = r.status as AttendanceStatus;
  }

  const todayStaffAttendance: Record<string, StaffAttendanceStatus> = {};
  for (const r of staffAttRows ?? []) {
    todayStaffAttendance[r.staff_id] = r.status as StaffAttendanceStatus;
  }

  return (
    <AttendanceClient
      initialSections={sections}
      initialStudentsBySection={studentsBySection}
      initialStaff={staff}
      todayAttendance={todayAttendance}
      todayStaffAttendance={todayStaffAttendance}
    />
  );
}
