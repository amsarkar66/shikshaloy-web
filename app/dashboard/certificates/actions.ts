"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
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
  const { error } = await supabaseAdmin
    .from("certificate_requests")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
}
