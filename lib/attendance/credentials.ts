"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { CredentialMethod } from "./resolve";
import { requireRole } from "@/lib/auth/verified-role";

export interface AttendanceCredentialRow {
  id: string;
  method: CredentialMethod;
  externalId: string;
  createdAt: string;
}

async function requireSchoolAdmin() {
  return requireRole(["admin", "super_admin"]);
}

type PersonType = "student" | "staff";

export async function listAttendanceCredentials(personType: PersonType, personId: string): Promise<AttendanceCredentialRow[]> {
  await requireSchoolAdmin();
  const idColumn = personType === "student" ? "student_id" : "staff_id";

  const { data } = await supabaseAdmin
    .from("attendance_credentials")
    .select("id, method, external_id, created_at")
    .eq(idColumn, personId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((c) => ({
    id: c.id,
    method: c.method as CredentialMethod,
    externalId: c.external_id,
    createdAt: c.created_at,
  }));
}

export async function addAttendanceCredential(
  personType: PersonType,
  personId: string,
  method: CredentialMethod,
  externalId: string,
): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const idColumn = personType === "student" ? "student_id" : "staff_id";

  const trimmed = externalId.trim();
  if (!trimmed) throw new Error("Card/device ID cannot be empty");

  const { error } = await supabaseAdmin.from("attendance_credentials").insert({
    school_id: schoolId,
    [idColumn]: personId,
    method,
    external_id: trimmed,
  });

  if (error) {
    if (error.code === "23505") throw new Error("This ID is already registered to someone else at this school");
    throw new Error(`Failed to save credential: ${error.message}`);
  }

  revalidatePath(personType === "student" ? "/dashboard/students" : "/dashboard/staff");
}

export async function removeAttendanceCredential(credentialId: string, personType: PersonType): Promise<void> {
  await requireSchoolAdmin();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("attendance_credentials")
    .delete()
    .eq("id", credentialId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to remove credential: ${error.message}`);
  revalidatePath(personType === "student" ? "/dashboard/students" : "/dashboard/staff");
}
