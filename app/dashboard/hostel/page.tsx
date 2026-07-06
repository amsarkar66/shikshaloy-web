import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import HostelClient from "./_components/HostelClient";
import type { HostelRoom, HostelStudent } from "./_data/hostel";

export default async function HostelPage() {
  const [{ data: roomRows }, { data: allotmentRows }] = await Promise.all([
    supabaseAdmin
      .from("hostel_rooms")
      .select("id, room_no, block, floor, type, capacity, warden_id, amenities, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("room_no"),

    supabaseAdmin
      .from("hostel_allotments")
      .select(`
        id, room_id, join_date, monthly_fee, fee_status,
        students ( full_name, roll_no, phone, sections ( name, grades ( level ) ), student_parents ( parents ( full_name ) ) )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("is_active", true),
  ]);

  const occupiedByRoom: Record<string, number> = {};
  for (const a of (allotmentRows ?? []) as any[]) {
    occupiedByRoom[a.room_id] = (occupiedByRoom[a.room_id] ?? 0) + 1;
  }

  const roomNoById: Record<string, string> = {};
  const blockById: Record<string, string> = {};
  for (const r of (roomRows ?? []) as any[]) {
    roomNoById[r.id] = r.room_no;
    blockById[r.id] = r.block;
  }

  const rooms: HostelRoom[] = (roomRows ?? []).map((r: any) => ({
    id: r.id,
    roomNo: r.room_no ?? "",
    block: r.block ?? "",
    floor: r.floor ?? 0,
    type: r.type ?? "single",
    capacity: r.capacity ?? 0,
    occupied: occupiedByRoom[r.id] ?? 0,
    warden: r.warden_id ? "Assigned" : "Unassigned",
    amenities: Array.isArray(r.amenities) ? r.amenities : [],
    status: r.status ?? "available",
  }));

  const students: HostelStudent[] = (allotmentRows ?? []).map((a: any) => ({
    id: a.id,
    studentName: a.students?.full_name ?? "Unknown",
    rollNo: a.students?.roll_no ?? "",
    classNum: String(a.students?.sections?.grades?.level ?? ""),
    section: a.students?.sections?.name ?? "",
    roomNo: roomNoById[a.room_id] ?? "—",
    block: blockById[a.room_id] ?? "—",
    joinDate: a.join_date,
    monthlyFee: Number(a.monthly_fee ?? 0),
    feeStatus: a.fee_status ?? "overdue",
    phone: a.students?.phone ?? "—",
    parentName: a.students?.student_parents?.[0]?.parents?.full_name ?? "—",
  }));

  const blocks = Array.from(new Set(rooms.map((r) => r.block))).sort();

  return <HostelClient rooms={rooms} students={students} blocks={blocks} />;
}
