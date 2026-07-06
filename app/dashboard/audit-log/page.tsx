import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import AuditLogClient from "./_components/AuditLogClient";
import type { AuditEntry } from "./_data/audit-log";

export default async function AuditLogPage() {
  const { data: rows } = await supabaseAdmin
    .from("audit_log")
    .select("id, actor_name, actor_role, action, module, description, created_at, ip_address")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("created_at", { ascending: false });

  const entries: AuditEntry[] = ((rows ?? []) as any[]).map((e) => ({
    id: e.id,
    actor: e.actor_name,
    actorRole: e.actor_role,
    action: e.action,
    module: e.module,
    description: e.description,
    timestamp: e.created_at,
    ipAddress: e.ip_address ?? "—",
  }));

  return <AuditLogClient entries={entries} />;
}
