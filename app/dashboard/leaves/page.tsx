import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getTeacherContext } from "@/lib/teachers/context";
import LeavesClient from "./_components/LeavesClient";
import type { Leave, StaffOption, StudentOption } from "./_components/LeavesClient";
import MyLeavesClient, { type MyLeave } from "./_components/MyLeavesClient";
import type { LeaveType, LeaveStatus } from "./_data/leaves";

interface LeaveRequestRow {
  id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  staff_members: { full_name: string | null; designation: string | null; department: string | null } | null;
  approver: { full_name: string | null } | null;
}

interface StudentLeaveRequestRow {
  id: string;
  student_id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  students: { full_name: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
  approver: { full_name: string | null } | null;
}

interface StaffPickerRow {
  id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
}

interface StudentPickerRow {
  id: string;
  full_name: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

async function MyLeaves({ userId }: { userId: string }) {
  const teacher = await getTeacherContext(userId);

  if (!teacher) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
        </div>
      </div>
    );
  }

  const { data } = await supabaseAdmin
    .from("leave_requests")
    .select("id, leave_type, from_date, to_date, days, reason, status, applied_on")
    .eq("staff_id", teacher.staffId)
    .order("applied_on", { ascending: false });

  const leaves: MyLeave[] = (data ?? []).map((l) => ({
    id: l.id,
    leaveType: l.leave_type as LeaveType,
    from: l.from_date ?? "",
    to: l.to_date ?? "",
    days: l.days ?? 1,
    reason: l.reason ?? "",
    status: (l.status ?? "pending") as LeaveStatus,
    appliedOn: l.applied_on ?? "",
  }));

  return <MyLeavesClient staffId={teacher.staffId} leaves={leaves} />;
}

export default async function LeavesPage() {
  const { data: { user } } = await getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if ((role === "teacher" || role === "driver") && user) {
    return <MyLeaves userId={user.id} />;
  }

  if (role === "staff" && user) {
    const staffTemplateId = user.user_metadata?.staff_template_id as string | undefined;
    if (staffTemplateId !== "hr_manager") {
      return <MyLeaves userId={user.id} />;
    }
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data }, { data: studentData }, { data: staffRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("leave_requests")
      .select(`
        id, leave_type, from_date, to_date, days, reason, status, applied_on,
        staff_members!leave_requests_staff_id_fkey ( full_name, designation, department ),
        approver:staff_members!leave_requests_approved_by_fkey ( full_name )
      `)
      .eq("school_id", schoolId)
      .order("applied_on", { ascending: false }),

    supabaseAdmin
      .from("student_leave_requests")
      .select(`
        id, student_id, leave_type, from_date, to_date, days, reason, status, applied_on,
        students ( full_name, sections ( name, grades ( level ) ) ),
        approver:staff_members!student_leave_requests_approved_by_fkey ( full_name )
      `)
      .eq("school_id", schoolId)
      .order("applied_on", { ascending: false }),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, designation, department")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("full_name"),

    supabaseAdmin
      .from("students")
      .select("id, full_name, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const staffLeaves: Leave[] = ((data ?? []) as unknown as LeaveRequestRow[]).map((l) => ({
    id: l.id,
    personType: "staff",
    staffName: l.staff_members?.full_name ?? "Unknown",
    role: l.staff_members?.designation ?? "",
    department: l.staff_members?.department ?? "",
    leaveType: l.leave_type as Leave["leaveType"],
    from: l.from_date ?? "",
    to: l.to_date ?? "",
    days: l.days ?? 1,
    reason: l.reason ?? "",
    status: (l.status ?? "pending") as Leave["status"],
    appliedOn: l.applied_on ?? "",
    approvedBy: l.approver?.full_name ?? undefined,
  }));

  const studentLeaves: Leave[] = ((studentData ?? []) as unknown as StudentLeaveRequestRow[]).map((l) => {
    const section = l.students?.sections;
    const classLabel = section ? `${section.grades?.level ?? "—"}-${section.name ?? ""}` : "";
    return {
      id: l.id,
      personType: "student",
      studentId: l.student_id,
      staffName: l.students?.full_name ?? "Unknown",
      role: "Student",
      department: classLabel,
      leaveType: l.leave_type as Leave["leaveType"],
      from: l.from_date ?? "",
      to: l.to_date ?? "",
      days: l.days ?? 1,
      reason: l.reason ?? "",
      status: (l.status ?? "pending") as Leave["status"],
      appliedOn: l.applied_on ?? "",
      approvedBy: l.approver?.full_name ?? undefined,
    };
  });

  const leaves = [...staffLeaves, ...studentLeaves].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));

  const staffOptions: StaffOption[] = ((staffRows ?? []) as unknown as StaffPickerRow[]).map((s) => ({
    id: s.id,
    name: s.full_name,
    role: s.designation ?? "",
    department: s.department ?? "",
  }));

  const studentOptions: StudentOption[] = ((studentRows ?? []) as unknown as StudentPickerRow[]).map((s) => ({
    id: s.id,
    name: s.full_name,
    classLabel: s.sections ? `${s.sections.grades?.level ?? "—"}-${s.sections.name ?? ""}` : "",
  }));

  return <LeavesClient initialLeaves={leaves} staffOptions={staffOptions} studentOptions={studentOptions} />;
}
