import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import HostelClient from "./_components/HostelClient";
import type { HostelRoom, HostelStudent, WardenOption, EligibleStudentOption } from "./_data/hostel";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and hostel wardens can manage hostel records.</p>
      </div>
    </div>
  );
}

interface HostelRoomRow {
  id: string;
  room_no: string | null;
  block: string | null;
  floor: number | null;
  type: string | null;
  capacity: number | null;
  warden_id: string | null;
  amenities: unknown;
  status: string | null;
}

interface HostelAllotmentRow {
  id: string;
  room_id: string;
  student_id: string;
  join_date: string;
  monthly_fee: number | null;
  fee_status: string | null;
  students: {
    full_name: string | null;
    roll_no: string | null;
    phone: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
    student_parents: { parents: { full_name: string | null } | null }[] | null;
  } | null;
}

interface EligibleStudentRow {
  id: string;
  full_name: string | null;
  roll_no: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

export default async function HostelPage() {
  try {
    await requireRoleOrStaffTemplate(["admin"], ["warden"]);
  } catch {
    return <Unauthorized />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: roomRows }, { data: allotmentRows }, { data: wardenRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("hostel_rooms")
      .select("id, room_no, block, floor, type, capacity, warden_id, amenities, status")
      .eq("school_id", schoolId)
      .order("room_no"),

    supabaseAdmin
      .from("hostel_allotments")
      .select(`
        id, room_id, student_id, join_date, monthly_fee, fee_status,
        students ( full_name, roll_no, phone, sections ( name, grades ( level ) ), student_parents ( parents ( full_name ) ) )
      `)
      .eq("school_id", schoolId)
      .eq("is_active", true),

    supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("role", "staff")
      .eq("status", "active")
      .order("full_name"),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const occupiedByRoom: Record<string, number> = {};
  for (const a of (allotmentRows ?? []) as unknown as HostelAllotmentRow[]) {
    occupiedByRoom[a.room_id] = (occupiedByRoom[a.room_id] ?? 0) + 1;
  }

  const roomNoById: Record<string, string> = {};
  const blockById: Record<string, string> = {};
  for (const r of (roomRows ?? []) as unknown as HostelRoomRow[]) {
    roomNoById[r.id] = r.room_no ?? "";
    blockById[r.id] = r.block ?? "";
  }

  const wardenNameById: Record<string, string> = {};
  for (const w of wardenRows ?? []) {
    wardenNameById[w.id] = w.full_name ?? "Unnamed staff";
  }

  const rooms: HostelRoom[] = ((roomRows ?? []) as unknown as HostelRoomRow[]).map((r) => ({
    id: r.id,
    roomNo: r.room_no ?? "",
    block: r.block ?? "",
    floor: r.floor ?? 0,
    type: (r.type ?? "single") as HostelRoom["type"],
    capacity: r.capacity ?? 0,
    occupied: occupiedByRoom[r.id] ?? 0,
    warden: r.warden_id ? (wardenNameById[r.warden_id] ?? "Assigned") : "Unassigned",
    wardenId: r.warden_id,
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    status: (r.status ?? "available") as HostelRoom["status"],
  }));

  const students: HostelStudent[] = ((allotmentRows ?? []) as unknown as HostelAllotmentRow[]).map((a) => ({
    id: a.id,
    studentName: a.students?.full_name ?? "Unknown",
    rollNo: a.students?.roll_no ?? "",
    classNum: String(a.students?.sections?.grades?.level ?? ""),
    section: a.students?.sections?.name ?? "",
    roomNo: roomNoById[a.room_id] ?? "—",
    block: blockById[a.room_id] ?? "—",
    joinDate: a.join_date,
    monthlyFee: Number(a.monthly_fee ?? 0),
    feeStatus: (a.fee_status ?? "overdue") as HostelStudent["feeStatus"],
    phone: a.students?.phone ?? "—",
    parentName: a.students?.student_parents?.[0]?.parents?.full_name ?? "—",
  }));

  const blocks = Array.from(new Set(rooms.map((r) => r.block))).sort();

  const wardens: WardenOption[] = (wardenRows ?? []).map((w) => ({
    id: w.id,
    name: w.full_name ?? "Unnamed staff",
  }));

  const housedStudentIds = new Set(
    ((allotmentRows ?? []) as unknown as HostelAllotmentRow[]).map((a) => a.student_id),
  );

  const eligibleStudents: EligibleStudentOption[] = ((studentRows ?? []) as unknown as EligibleStudentRow[])
    .filter((s) => !housedStudentIds.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.full_name ?? "Unnamed student",
      rollNo: s.roll_no ?? "",
      classNum: String(s.sections?.grades?.level ?? ""),
      section: s.sections?.name ?? "",
    }));

  return (
    <HostelClient
      rooms={rooms}
      students={students}
      blocks={blocks}
      wardens={wardens}
      eligibleStudents={eligibleStudents}
    />
  );
}
