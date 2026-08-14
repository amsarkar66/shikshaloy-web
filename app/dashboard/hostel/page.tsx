import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import HostelClient from "./_components/HostelClient";
import type { HostelRoom, HostelStudent } from "./_data/hostel";

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

export default async function HostelPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: roomRows }, { data: allotmentRows }] = await Promise.all([
    supabaseAdmin
      .from("hostel_rooms")
      .select("id, room_no, block, floor, type, capacity, warden_id, amenities, status")
      .eq("school_id", schoolId)
      .order("room_no"),

    supabaseAdmin
      .from("hostel_allotments")
      .select(`
        id, room_id, join_date, monthly_fee, fee_status,
        students ( full_name, roll_no, phone, sections ( name, grades ( level ) ), student_parents ( parents ( full_name ) ) )
      `)
      .eq("school_id", schoolId)
      .eq("is_active", true),
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

  const rooms: HostelRoom[] = ((roomRows ?? []) as unknown as HostelRoomRow[]).map((r) => ({
    id: r.id,
    roomNo: r.room_no ?? "",
    block: r.block ?? "",
    floor: r.floor ?? 0,
    type: (r.type ?? "single") as HostelRoom["type"],
    capacity: r.capacity ?? 0,
    occupied: occupiedByRoom[r.id] ?? 0,
    warden: r.warden_id ? "Assigned" : "Unassigned",
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

  return <HostelClient rooms={rooms} students={students} blocks={blocks} />;
}
