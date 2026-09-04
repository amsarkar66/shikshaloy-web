import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import AuditLogClient from "./_components/AuditLogClient";
import type { AuditEntry } from "./_data/audit-log";

export default async function AuditLogPage() {
  const verifiedUser = await getVerifiedUser();
  const role = verifiedUser?.role ?? "";

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
    const schools = await getInstitutionSchools(institutionId);

    const schoolsById = new Map(schools.map((s) => [s.id, s.name]));
    const schoolIds = schools.map((s) => s.id);

    const { data: rows } = schoolIds.length
      ? await supabaseAdmin
          .from("audit_log")
          .select("id, school_id, actor_name, actor_role, action, module, description, created_at")
          .in("school_id", schoolIds)
          .order("created_at", { ascending: false })
      : { data: [] as { id: string; school_id: string; actor_name: string; actor_role: string; action: string; module: string; description: string | null; created_at: string }[] };

    const entries: AuditEntry[] = (rows ?? []).map((e) => ({
      id: e.id,
      actor: e.actor_name,
      actorRole: e.actor_role,
      action: e.action,
      module: e.module,
      description: e.description,
      timestamp: e.created_at,
      schoolName: schoolsById.get(e.school_id) ?? "—",
    }));

    return <AuditLogClient entries={entries} />;
  }

  if (role !== "admin") {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to the audit log.</p>
        </div>
      </div>
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: rows } = await supabaseAdmin
    .from("audit_log")
    .select("id, actor_name, actor_role, action, module, description, created_at")
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
  }));

  return <AuditLogClient entries={entries} />;
}
