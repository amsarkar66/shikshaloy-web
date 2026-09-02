"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { getVerifiedUser, requireRole } from "@/lib/auth/verified-role";
import type { CertType } from "./_data/certificates";
import type { StudentOption } from "./_components/CertificatesClient";

interface StudentSearchRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

const STUDENT_PAGE_SIZE = 20;

export interface StudentSearchPage {
  students: StudentOption[];
  hasMore: boolean;
}

export async function searchActiveStudents(query: string, offset = 0): Promise<StudentSearchPage> {
  const q = query.trim();
  const schoolId = await getCurrentSchoolIdOrThrow();

  let builder = supabaseAdmin
    .from("students")
    .select("id, full_name, roll_no, sections ( name, grades ( level ) )")
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (q) builder = builder.or(`full_name.ilike.%${q}%,roll_no.ilike.%${q}%`);

  const { data } = await builder
    .order("full_name")
    .range(offset, offset + STUDENT_PAGE_SIZE); // one extra row to detect hasMore

  const rows = (data ?? []) as unknown as StudentSearchRow[];
  const hasMore = rows.length > STUDENT_PAGE_SIZE;

  return {
    students: rows.slice(0, STUDENT_PAGE_SIZE).map((s) => ({
      id: s.id,
      name: s.full_name,
      rollNo: s.roll_no ?? "",
      class: String(s.sections?.grades?.level ?? ""),
      section: s.sections?.name ?? "",
    })),
    hasMore,
  };
}

export async function requestCertificate(studentId: string, certType: CertType, purpose: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();

  // A parent submitting this from their Reports page must only be able to
  // request certificates for their own linked children, not any student id.
  const vu = await getVerifiedUser();
  if (vu?.role === "parent") {
    const { data: parent } = await supabaseAdmin.from("parents").select("id").eq("profile_id", vu.id).maybeSingle();
    const { data: link } = parent
      ? await supabaseAdmin.from("student_parents").select("student_id").eq("parent_id", parent.id).eq("student_id", studentId).maybeSingle()
      : { data: null };
    if (!link) throw new Error("This student isn't linked to your account.");
  }

  const { data, error } = await supabaseAdmin
    .from("certificate_requests")
    .insert({
      school_id: schoolId,
      student_id: studentId,
      cert_type: certType,
      purpose,
      status: "pending",
    })
    .select("id, requested_on")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to submit certificate request");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
  return { id: data.id as string, requestedOn: data.requested_on as string };
}

export async function rejectCertificateRequest(id: string) {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("certificate_requests", id);

  const { error } = await supabaseAdmin
    .from("certificate_requests")
    .update({ status: "rejected" })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
}

export async function markCertificateReady(id: string) {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("certificate_requests", id);

  const { error } = await supabaseAdmin
    .from("certificate_requests")
    .update({ status: "ready" })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
}

export async function markCertificateIssued(id: string) {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("certificate_requests", id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: staffRow } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("certificate_requests")
    .update({
      status: "issued",
      issued_on: new Date().toISOString().slice(0, 10),
      issued_by: staffRow?.id ?? null,
    })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
}
