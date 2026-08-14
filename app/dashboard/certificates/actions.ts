"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { CertType } from "./_data/certificates";

export async function requestCertificate(studentId: string, certType: CertType, purpose: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("certificate_requests").insert({
    school_id: schoolId,
    student_id: studentId,
    cert_type: certType,
    purpose,
    status: "pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/certificates");
}
