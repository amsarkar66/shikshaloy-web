"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { generateDeviceKey, hashDeviceKey, deviceKeyPrefix } from "./crypto";
import { requireRole } from "@/lib/auth/verified-role";

export type DeviceType = "rfid" | "biometric";

export interface AttendanceDeviceRow {
  id: string;
  name: string;
  type: DeviceType;
  location: string | null;
  keyPrefix: string;
  serialNumber: string | null;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
}

async function requireSchoolAdmin() {
  return requireRole(["admin", "super_admin"]);
}

export async function listAttendanceDevices(): Promise<AttendanceDeviceRow[]> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data } = await supabaseAdmin
    .from("attendance_devices")
    .select("id, name, type, location, key_prefix, serial_number, is_active, last_seen_at, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type as DeviceType,
    location: d.location,
    keyPrefix: d.key_prefix,
    serialNumber: d.serial_number,
    isActive: d.is_active,
    lastSeenAt: d.last_seen_at,
    createdAt: d.created_at,
  }));
}

export async function createAttendanceDevice(
  name: string,
  type: DeviceType,
  location?: string,
  serialNumber?: string,
): Promise<{ plaintextKey: string }> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const plaintextKey = generateDeviceKey();
  const keyHash = await hashDeviceKey(plaintextKey);

  const { error } = await supabaseAdmin.from("attendance_devices").insert({
    school_id: schoolId,
    name: name.trim() || "Unnamed device",
    type,
    location: location?.trim() || null,
    key_hash: keyHash,
    key_prefix: deviceKeyPrefix(plaintextKey),
    serial_number: serialNumber?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") throw new Error("A device with this serial number is already registered");
    throw new Error(`Failed to register device: ${error.message}`);
  }

  revalidatePath("/dashboard/attendance/devices");
  return { plaintextKey };
}

export async function setAttendanceDeviceActive(deviceId: string, isActive: boolean): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("attendance_devices")
    .update({ is_active: isActive })
    .eq("id", deviceId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update device: ${error.message}`);
  revalidatePath("/dashboard/attendance/devices");
}
