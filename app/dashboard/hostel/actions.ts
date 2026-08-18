"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { RoomType, RoomStatus, FeeStatus } from "./_data/hostel";

export interface RoomInput {
  roomNo: string;
  block?: string | null;
  floor?: number | null;
  type: RoomType;
  capacity: number;
  wardenId?: string | null;
  amenities: string[];
  status: RoomStatus;
}

function validateRoomInput(input: RoomInput) {
  const roomNo = input.roomNo.trim();
  if (!roomNo) throw new Error("Room number is required.");
  if (!input.capacity || input.capacity <= 0) throw new Error("Enter a valid capacity.");
  return roomNo;
}

export async function createRoom(input: RoomInput): Promise<{ id: string }> {
  const roomNo = validateRoomInput(input);
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("hostel_rooms")
    .insert({
      school_id: schoolId,
      room_no: roomNo,
      block: input.block?.trim() || null,
      floor: input.floor ?? null,
      type: input.type,
      capacity: input.capacity,
      warden_id: input.wardenId || null,
      amenities: input.amenities,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Room ${roomNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/hostel");
  return { id: data.id };
}

export interface UpdateRoomInput extends RoomInput {
  id: string;
}

export async function updateRoom(input: UpdateRoomInput): Promise<void> {
  const roomNo = validateRoomInput(input);
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("hostel_rooms")
    .update({
      room_no: roomNo,
      block: input.block?.trim() || null,
      floor: input.floor ?? null,
      type: input.type,
      capacity: input.capacity,
      warden_id: input.wardenId || null,
      amenities: input.amenities,
      status: input.status,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`Room ${roomNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/hostel");
}

export interface AllotStudentInput {
  studentId: string;
  roomId: string;
  joinDate: string;
  monthlyFee: number;
  feeStatus: FeeStatus;
}

export async function allotStudent(input: AllotStudentInput): Promise<{ id: string }> {
  if (!input.studentId) throw new Error("Select a student.");
  if (!input.roomId) throw new Error("Select a room.");
  if (!input.joinDate) throw new Error("Join date is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: room }, { count: occupied }, { data: existing }] = await Promise.all([
    supabaseAdmin.from("hostel_rooms").select("capacity").eq("id", input.roomId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("hostel_allotments").select("id", { count: "exact", head: true }).eq("room_id", input.roomId).eq("is_active", true),
    supabaseAdmin.from("hostel_allotments").select("id").eq("student_id", input.studentId).eq("is_active", true).maybeSingle(),
  ]);

  if (!room) throw new Error("Room not found.");
  if (existing) throw new Error("This student already has an active hostel allotment.");
  if ((occupied ?? 0) >= room.capacity) throw new Error("This room is already at full capacity.");

  const { data, error } = await supabaseAdmin
    .from("hostel_allotments")
    .insert({
      school_id: schoolId,
      student_id: input.studentId,
      room_id: input.roomId,
      join_date: input.joinDate,
      monthly_fee: input.monthlyFee,
      fee_status: input.feeStatus,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/hostel");
  return { id: data.id };
}

export interface UpdateAllotmentInput {
  id: string;
  roomId: string;
  monthlyFee: number;
  feeStatus: FeeStatus;
}

export async function updateAllotment(input: UpdateAllotmentInput): Promise<void> {
  if (!input.roomId) throw new Error("Select a room.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: current } = await supabaseAdmin
    .from("hostel_allotments")
    .select("room_id")
    .eq("id", input.id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!current) throw new Error("Allotment not found.");

  if (current.room_id !== input.roomId) {
    const [{ data: room }, { count: occupied }] = await Promise.all([
      supabaseAdmin.from("hostel_rooms").select("capacity").eq("id", input.roomId).eq("school_id", schoolId).maybeSingle(),
      supabaseAdmin.from("hostel_allotments").select("id", { count: "exact", head: true }).eq("room_id", input.roomId).eq("is_active", true),
    ]);
    if (!room) throw new Error("Room not found.");
    if ((occupied ?? 0) >= room.capacity) throw new Error("This room is already at full capacity.");
  }

  const { error } = await supabaseAdmin
    .from("hostel_allotments")
    .update({ room_id: input.roomId, monthly_fee: input.monthlyFee, fee_status: input.feeStatus })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/hostel");
}

export async function vacateStudent(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("hostel_allotments")
    .update({ is_active: false, leave_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/hostel");
}
