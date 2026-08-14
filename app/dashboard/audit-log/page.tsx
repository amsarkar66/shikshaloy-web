import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import AuditLogClient from "./_components/AuditLogClient";
import type { AuditEntry } from "./_data/audit-log";

export default async function AuditLogPage() {
  const {
    data: { user },
  } = await getUser();
  const role = (user?.user_metadata?.role as string) ?? "";

  if (role === "kernel") {
    const [{ data: rows }, { data: schools }] = await Promise.all([
      supabaseAdmin
        .from("audit_log")
        .select("id, school_id, actor_name, actor_role, action, module, description, created_at, ip_address")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("schools").select("id, name"),
    ]);

    const schoolsById = new Map((schools ?? []).map((s) => [s.id, s.name]));

    const entries: AuditEntry[] = (rows ?? []).map((e) => ({
      id: e.id,
      actor: e.actor_name,
      actorRole: e.actor_role,
      action: e.action,
      module: e.module,
      description: e.description,
      timestamp: e.created_at,
      ipAddress: e.ip_address ?? "—",
      schoolName: schoolsById.get(e.school_id) ?? "—",
    }));

    return <AuditLogClient entries={entries} />;
  }

  if (role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const { data: schools } = await supabaseAdmin
      .from("schools")
      .select("id, name")
      .eq("institution_id", institutionId);

    const schoolsById = new Map((schools ?? []).map((s) => [s.id, s.name]));
    const schoolIds = (schools ?? []).map((s) => s.id);

    const { data: rows } = schoolIds.length
      ? await supabaseAdmin
          .from("audit_log")
          .select("id, school_id, actor_name, actor_role, action, module, description, created_at, ip_address")
          .in("school_id", schoolIds)
          .order("created_at", { ascending: false })
      : { data: [] as { id: string; school_id: string; actor_name: string; actor_role: string; action: string; module: string; description: string | null; created_at: string; ip_address: string | null }[] };

    const entries: AuditEntry[] = (rows ?? []).map((e) => ({
      id: e.id,
      actor: e.actor_name,
      actorRole: e.actor_role,
      action: e.action,
      module: e.module,
      description: e.description,
      timestamp: e.created_at,
      ipAddress: e.ip_address ?? "—",
      schoolName: schoolsById.get(e.school_id) ?? "—",
    }));

    return <AuditLogClient entries={entries} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: rows } = await supabaseAdmin
    .from("audit_log")
    .select("id, actor_name, actor_role, action, module, description, created_at, ip_address")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const entries: AuditEntry[] = (rows ?? []).map((e) => ({
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
