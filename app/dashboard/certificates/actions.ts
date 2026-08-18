"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { CertType } from "./_data/certificates";

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
