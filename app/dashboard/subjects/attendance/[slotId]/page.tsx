import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import SubjectAttendanceClient from "../_components/SubjectAttendanceClient";
import type { SubjectStatus, SubjectStudent } from "../_components/SubjectAttendanceClient";

interface SlotRow {
  id: string;
  section_id: string;
  teacher_id: string | null;
  period_number: number;
  room: string | null;
  subjects: { name: string | null } | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  profiles: { full_name: string | null } | null;
}

interface PeriodRow {
  start_time: string;
  end_time: string;
}

interface SessionRow {
  id: string;
  conducted: boolean;
  remarks: string | null;
}

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">You can only mark attendance for a class period you teach.</p>
      </div>
    </div>
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SubjectAttendancePage({
  params, searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slotId } = await params;
  const { date } = await searchParams;

  const { data: { user } } = await getUser();
  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "teacher")) return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const today = new Date().toISOString().split("T")[0];
  const dateStr = date && DATE_RE.test(date) ? date : today;

  const { data: slotRow } = await supabaseAdmin
    .from("timetable_slots")
    .select("id, section_id, teacher_id, period_number, room, subjects ( name ), sections ( name, grades ( level ) ), profiles ( full_name )")
    .eq("id", slotId)
    .eq("school_id", schoolId)
    .maybeSingle<SlotRow>();

  if (!slotRow) notFound();
  if (role === "teacher" && slotRow.teacher_id !== user.id) return <Unauthorized />;

  const [{ data: periodRow }, { data: studentRows }, { data: sessionRow }] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("start_time, end_time")
      .eq("school_id", schoolId)
      .eq("number", slotRow.period_number)
      .maybeSingle<PeriodRow>(),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no")
      .eq("section_id", slotRow.section_id)
      .order("roll_no"),

    supabaseAdmin
      .from("subject_attendance_sessions")
      .select("id, conducted, remarks")
      .eq("timetable_slot_id", slotId)
      .eq("date", dateStr)
      .maybeSingle<SessionRow>(),
  ]);

  const { data: attRows } = sessionRow
    ? await supabaseAdmin.from("subject_attendance").select("student_id, status").eq("session_id", sessionRow.id)
    : { data: [] as { student_id: string; status: string }[] };

  const statusMap: Record<string, SubjectStatus> = {};
  for (const r of attRows ?? []) statusMap[r.student_id] = r.status as SubjectStatus;

  const students: SubjectStudent[] = (studentRows ?? []).map((st) => ({
    id: st.id,
    name: st.full_name ?? "Unknown",
    rollNo: st.roll_no ?? "",
  }));

  return (
    <SubjectAttendanceClient
      slotId={slotId}
      subjectName={slotRow.subjects?.name ?? "Subject"}
      classLabel={`${slotRow.sections?.grades?.level ?? "?"}-${slotRow.sections?.name ?? ""}`}
      teacherName={slotRow.profiles?.full_name ?? "—"}
      room={slotRow.room ?? ""}
      periodStart={periodRow?.start_time?.slice(0, 5) ?? ""}
      periodEnd={periodRow?.end_time?.slice(0, 5) ?? ""}
      students={students}
      initialStatusMap={statusMap}
      dateStr={dateStr}
      conducted={sessionRow?.conducted ?? true}
      remarks={sessionRow?.remarks ?? null}
    />
  );
}
