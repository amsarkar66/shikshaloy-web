import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentContext } from "@/lib/students/context";
import { getTeacherContext } from "@/lib/teachers/context";
import { getDriverContext } from "@/lib/drivers/context";
import AttendanceClient from "./_components/AttendanceClient";
import type {
  AttendanceSec, AttendanceStudent, AttendanceStaff,
  AttendanceStatus, StaffAttendanceStatus,
} from "./_components/AttendanceClient";
import DriverAttendanceClient, { type TripStatus } from "./_components/DriverAttendanceClient";
import { CheckCircle2, XCircle, Clock as ClockIcon, TrendingUp } from "lucide-react";

interface SectionAttendanceRow {
  id: string;
  name: string | null;
  room: string | null;
  capacity: number | null;
  avg_attendance: number | null;
  status: string | null;
  grades: { level: number | null } | null;
  profiles: { full_name: string | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  absent:  "bg-red-500/10 text-red-600 dark:text-red-400",
  late:    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

// Server fetches this many days up front; the client-side range dropdown
// slices down from it, so switching ranges never needs a refetch.
const TREND_DAYS = 90;

// Builds a fixed-length daily attendance-rate series (oldest → newest, today
// included) from raw status rows, so the Overview trend chart always has one
// bar per day even on days nothing was marked yet. rate is null (not 0) for
// a day with no attendance rows at all, so the chart can tell "nobody showed
// up" apart from "nobody took attendance".
function buildAttendanceTrend(rows: { date: string; status: string }[], totalEnrolled: number): { date: string; rate: number | null }[] {
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

async function StudentAttendance({ userId }: { userId: string }) {
  const student = await getStudentContext(userId);

  if (!student) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No student record linked to this login</p>
        </div>
      </div>
    );
  }

  const { data: records } = await supabaseAdmin
    .from("student_attendance")
    .select("date, status")
    .eq("student_id", student.id)
    .order("date", { ascending: false })
    .limit(60);

  const all = (records ?? []) as { date: string; status: string }[];
  const presentCount = all.filter((r) => r.status === "present").length;
  const absentCount  = all.filter((r) => r.status === "absent").length;
  const lateCount    = all.filter((r) => r.status === "late").length;

  const stats = [
    { label: "Overall Attendance", value: `${student.attendancePct}%`, icon: TrendingUp, accent: "text-sky-500 bg-sky-500/10" },
    { label: "Present", value: String(presentCount), icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Absent", value: String(absentCount), icon: XCircle, accent: "text-red-500 bg-red-500/10" },
    { label: "Late", value: String(lateCount), icon: ClockIcon, accent: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Attendance</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Class {student.gradeLevel}-{student.sectionName} · Roll No {student.rollNo}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Recent Records</p>
        </div>
        {all.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-zinc-500">No attendance recorded yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {all.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className="text-gray-700 dark:text-zinc-300">
                  {new Date(r.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[r.status] ?? ""}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function TeacherAttendance({ userId }: { userId: string }) {
  const teacher = await getTeacherContext(userId);

  if (!teacher || teacher.sectionIds.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No classes assigned yet</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  const trendStartStr = trendStart.toISOString().split("T")[0];

  const [{ data: sectionRows }, { data: studentRows }, { data: studentAttRows }, { data: trendRows }] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, grades ( level ), profiles ( full_name )")
      .in("id", teacher.sectionIds)
      .order("name"),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, section_id, attendance_pct")
      .in("section_id", teacher.sectionIds)
      .order("roll_no"),

    supabaseAdmin
      .from("student_attendance")
      .select("student_id, status")
      .in("section_id", teacher.sectionIds)
      .eq("date", today),

    supabaseAdmin
      .from("student_attendance")
      .select("date, status")
      .in("section_id", teacher.sectionIds)
      .gte("date", trendStartStr)
      .lte("date", today),
  ]);

  const enrolledCount: Record<string, number> = {};
  for (const st of studentRows ?? []) {
    if (st.section_id) enrolledCount[st.section_id] = (enrolledCount[st.section_id] ?? 0) + 1;
  }

  const sections: AttendanceSec[] = ((sectionRows ?? []) as unknown as SectionAttendanceRow[]).map((s) => ({
    id:       s.id,
    classNum: String(s.grades?.level ?? "?"),
    section:  s.name ?? "",
    teacher:  s.profiles?.full_name ?? "",
    room:     s.room ?? "",
    enrolled: enrolledCount[s.id] ?? 0,
  })).sort((a, b) => +a.classNum - +b.classNum || a.section.localeCompare(b.section));

  const classLabelBySection: Record<string, { classNum: string; section: string }> = {};
  for (const s of sections) classLabelBySection[s.id] = { classNum: s.classNum, section: s.section };

  const studentsBySection: Record<string, AttendanceStudent[]> = {};
  for (const st of studentRows ?? []) {
    if (!st.section_id) continue;
    if (!studentsBySection[st.section_id]) studentsBySection[st.section_id] = [];
    studentsBySection[st.section_id].push({
      id:         st.id,
      name:       st.full_name ?? "Unknown",
      rollNo:     st.roll_no ?? "",
      attendance: Math.round(Number(st.attendance_pct ?? 0)),
      sectionId:  st.section_id,
      classNum:   classLabelBySection[st.section_id]?.classNum ?? "?",
      section:    classLabelBySection[st.section_id]?.section ?? "",
    });
  }

  const todayAttendance: Record<string, AttendanceStatus> = {};
  for (const r of studentAttRows ?? []) {
    todayAttendance[r.student_id] = r.status as AttendanceStatus;
  }

  const attendanceHistory = buildAttendanceTrend((trendRows ?? []) as { date: string; status: string }[], studentRows?.length ?? 0);

  return (
    <AttendanceClient
      initialSections={sections}
      initialStudentsBySection={studentsBySection}
      initialStaff={[]}
      todayAttendance={todayAttendance}
      todayStaffAttendance={{}}
      attendanceHistory={attendanceHistory}
      allowStaffTab={false}
    />
  );
}

async function DriverAttendance({ userId }: { userId: string }) {
  const driver = await getDriverContext(userId);

  if (!driver || driver.routes.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No route assigned yet</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const routeIds = driver.routes.map((r) => r.id);

  const { data: attRows } = await supabaseAdmin
    .from("transport_attendance")
    .select("student_id, trip, status")
    .in("route_id", routeIds)
    .eq("date", today);

  const todayAttendance: Record<string, TripStatus> = {};
  for (const r of attRows ?? []) {
    todayAttendance[`${r.student_id}:${r.trip}`] = r.status as TripStatus;
  }

  return <DriverAttendanceClient routes={driver.routes} todayAttendance={todayAttendance} date={today} />;
}

export default async function AttendancePage() {
  const { data: { user } } = await getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (role === "student" && user) {
    return <StudentAttendance userId={user.id} />;
  }

  if (role === "teacher" && user) {
    return <TeacherAttendance userId={user.id} />;
  }

  if (role === "driver" && user) {
    return <DriverAttendance userId={user.id} />;
  }

  const today = new Date().toISOString().split("T")[0];
  const academicYearId = await getCurrentAcademicYearId();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  const trendStartStr = trendStart.toISOString().split("T")[0];

  const [
    { data: sectionRows },
    { data: studentRows },
    { data: staffRows },
    { data: studentAttRows },
    { data: staffAttRows },
    { data: trendRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("sections")
      .select("id, name, room, capacity, avg_attendance, status, grades ( level ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .eq("status", "active")
      .order("name"),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, section_id, attendance_pct")
      .eq("school_id", schoolId)
      .order("roll_no"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, designation, department, employee_id, type, status")
      .eq("school_id", schoolId)
      .neq("status", "inactive"),

    supabaseAdmin
      .from("student_attendance")
      .select("student_id, status, checked_in_at, checked_out_at")
      .eq("school_id", schoolId)
      .eq("date", today),

    supabaseAdmin
      .from("staff_attendance")
      .select("staff_id, status, checked_in_at, checked_out_at")
      .eq("school_id", schoolId)
      .eq("date", today),

    supabaseAdmin
      .from("student_attendance")
      .select("date, status")
      .eq("school_id", schoolId)
      .gte("date", trendStartStr)
      .lte("date", today),
  ]);

  // Count enrolled per section
  const enrolledCount: Record<string, number> = {};
  for (const st of studentRows ?? []) {
    if (st.section_id) enrolledCount[st.section_id] = (enrolledCount[st.section_id] ?? 0) + 1;
  }

  const sections: AttendanceSec[] = ((sectionRows ?? []) as unknown as SectionAttendanceRow[]).map((s) => ({
    id:       s.id,
    classNum: String(s.grades?.level ?? "?"),
    section:  s.name ?? "",
    teacher:  s.profiles?.full_name ?? "",
    room:     s.room ?? "",
    enrolled: enrolledCount[s.id] ?? 0,
  })).sort((a, b) => +a.classNum - +b.classNum || a.section.localeCompare(b.section));

  const classLabelBySection: Record<string, { classNum: string; section: string }> = {};
  for (const s of sections) classLabelBySection[s.id] = { classNum: s.classNum, section: s.section };

  const studentCheckTimes: Record<string, { checkedInAt: string | null; checkedOutAt: string | null }> = {};
  for (const r of studentAttRows ?? []) {
    studentCheckTimes[r.student_id] = { checkedInAt: r.checked_in_at, checkedOutAt: r.checked_out_at };
  }

  // Group students by section
  const studentsBySection: Record<string, AttendanceStudent[]> = {};
  for (const st of studentRows ?? []) {
    if (!st.section_id) continue;
    if (!studentsBySection[st.section_id]) studentsBySection[st.section_id] = [];
    studentsBySection[st.section_id].push({
      id:           st.id,
      name:         st.full_name ?? "Unknown",
      rollNo:       st.roll_no ?? "",
      attendance:   Math.round(Number(st.attendance_pct ?? 0)),
      sectionId:    st.section_id,
      classNum:     classLabelBySection[st.section_id]?.classNum ?? "?",
      section:      classLabelBySection[st.section_id]?.section ?? "",
      checkedInAt:  studentCheckTimes[st.id]?.checkedInAt ?? null,
      checkedOutAt: studentCheckTimes[st.id]?.checkedOutAt ?? null,
    });
  }

  const staffCheckTimes: Record<string, { checkedInAt: string | null; checkedOutAt: string | null }> = {};
  for (const r of staffAttRows ?? []) {
    staffCheckTimes[r.staff_id] = { checkedInAt: r.checked_in_at, checkedOutAt: r.checked_out_at };
  }

  const staff: AttendanceStaff[] = (staffRows ?? []).map((s) => ({
    id:           s.id,
    name:         s.full_name ?? "",
    designation:  s.designation ?? "",
    department:   s.department ?? "",
    employeeId:   s.employee_id ?? "",
    type:         (s.type ?? "teaching") as AttendanceStaff["type"],
    status:       s.status ?? "active",
    checkedInAt:  staffCheckTimes[s.id]?.checkedInAt ?? null,
    checkedOutAt: staffCheckTimes[s.id]?.checkedOutAt ?? null,
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

  const attendanceHistory = buildAttendanceTrend((trendRows ?? []) as { date: string; status: string }[], studentRows?.length ?? 0);

  return (
    <AttendanceClient
      initialSections={sections}
      initialStudentsBySection={studentsBySection}
      initialStaff={staff}
      todayAttendance={todayAttendance}
      todayStaffAttendance={todayStaffAttendance}
      attendanceHistory={attendanceHistory}
    />
  );
}
