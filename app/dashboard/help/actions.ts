"use server";

import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { sendSupportRequestEmail } from "@/lib/email/resend";

export interface SubmitSupportRequestInput {
  category: string;
  subject: string;
  message: string;
}

export async function submitSupportRequest(input: SubmitSupportRequestInput): Promise<void> {
  const {
    data: { user },
  } = await getUser();
  if (!user || user.user_metadata?.role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) throw new Error("Subject and message are required");

  const institutionId = await getCurrentInstitutionIdOrThrow();
  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .maybeSingle();

  await sendSupportRequestEmail({
    institutionName: institution?.name ?? "—",
    fromName: (user.user_metadata?.full_name as string) || user.email || "—",
    fromEmail: user.email ?? "—",
    category: input.category,
    subject,
    message,
  });
}
