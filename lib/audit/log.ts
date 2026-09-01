import { headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedRole } from "@/lib/auth/verified-role";

export type AuditAction = "create" | "update" | "delete" | "approve" | "reject" | "login";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Institution Owner",
  admin: "Admin",
  teacher: "Teacher",
  staff: "Staff",
  parent: "Parent",
  student: "Student",
  driver: "Driver",
  kernel: "Product Owner",
};

// Best-effort activity trail — failures here must never block the action that
// triggered them, so errors are swallowed rather than thrown.
export async function logAuditEvent(input: {
  schoolId: string;
  action: AuditAction;
  module: string;
  description: string;
}): Promise<void> {
  try {
    const { data: { user } } = await getUser();
    if (!user) return;

    const role = (await getVerifiedRole()) ?? "";
    await supabaseAdmin.from("audit_log").insert({
      school_id: input.schoolId,
      actor_name: (user.user_metadata?.full_name as string) || user.email || "Unknown",
      actor_role: ROLE_LABEL[role] ?? (role || "User"),
      action: input.action,
      module: input.module,
      description: input.description,
      ip_address: await getClientIp(),
    });
  } catch {
    // swallow — logging failures shouldn't surface to the end user
  }
}

// x-forwarded-for can carry a client-proxy chain ("client, proxy1, proxy2");
// the first entry is the original client. x-real-ip is the fallback some
// proxies set instead.
async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip");
}
