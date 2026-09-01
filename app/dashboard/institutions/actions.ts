"use server";

import { createHash, randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { hardDeleteInstitution, listKernelUsers } from "@/lib/supabase/admin";
import { sendInstitutionDeleteOtpEmail, sendInstitutionDeletedEmail } from "@/lib/email/resend";
import { requireKernelOwner as requireVerifiedKernelOwner } from "@/lib/auth/verified-role";

async function requireKernelOwner() {
  // Verifies role/kernel_permission against `profiles`, not the
  // self-editable user_metadata JWT claim.
  await requireVerifiedKernelOwner();

  const {
    data: { user },
  } = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

// Step 1 of the delete flow — emails a 6-digit code to the requesting
// kernel owner's own account (not the institution's), as a "prove it's
// really you" gate before an irreversible action.
export async function requestInstitutionDeleteOtp(institutionId: string): Promise<{ email: string }> {
  const user = await requireKernelOwner();
  if (!user.email) throw new Error("Your account has no email on file.");

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .maybeSingle();
  if (!institution) throw new Error("Institution not found");

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");

  // Any code already outstanding for this institution is invalidated by a
  // fresh request — only the latest one is ever valid.
  await supabaseAdmin.from("institution_deletion_otps").delete().eq("institution_id", institutionId);

  const { error } = await supabaseAdmin.from("institution_deletion_otps").insert({
    institution_id: institutionId,
    requested_by: user.id,
    code_hash: hashCode(code),
    expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) throw new Error(`Failed to start verification: ${error.message}`);

  // Throws if the email genuinely didn't send — the UI shouldn't advance to
  // "enter your code" for a code that never reached an inbox.
  await sendInstitutionDeleteOtpEmail({ to: user.email, institutionName: institution.name, code });

  return { email: user.email };
}

// Step 2 — verifies the code, then runs the permanent cascade delete.
export async function confirmInstitutionDelete(institutionId: string, code: string): Promise<void> {
  const user = await requireKernelOwner();

  const { data: otp } = await supabaseAdmin
    .from("institution_deletion_otps")
    .select("id, code_hash, expires_at, attempts")
    .eq("institution_id", institutionId)
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp || new Date(otp.expires_at) < new Date()) {
    throw new Error("Verification code expired. Please request a new one.");
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many incorrect attempts. Please request a new code.");
  }
  if (hashCode(code.trim()) !== otp.code_hash) {
    await supabaseAdmin.from("institution_deletion_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    throw new Error("Incorrect verification code.");
  }

  await supabaseAdmin.from("institution_deletion_otps").delete().eq("id", otp.id);

  const { institutionName, schoolNames } = await hardDeleteInstitution(institutionId);

  const ownerEmails = (await listKernelUsers())
    .filter((k) => k.permission === "owner")
    .map((k) => k.email)
    .filter((e): e is string => !!e && e !== "—");

  await sendInstitutionDeletedEmail({
    to: ownerEmails,
    institutionName,
    schoolNames,
    deletedBy: (user.user_metadata?.full_name as string) || user.email || "a platform owner",
  });

  revalidatePath("/dashboard/institutions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
}
