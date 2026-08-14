import { supabaseAdmin } from "@/lib/supabase/service";
import { BUILTIN_META, BUILTIN_DEFAULTS, emptyPerms, type Template, type ModulePerms } from "./role-template-constants";

interface RoleTemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_builtin: boolean;
  permissions: ModulePerms;
}

function mapRow(row: RoleTemplateRow): Template {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    isBuiltin: row.is_builtin,
    permissions: { ...emptyPerms(), ...row.permissions },
  };
}

export async function getOrSeedRoleTemplates(schoolId: string): Promise<Template[]> {
  const { data: existing } = await supabaseAdmin
    .from("role_templates")
    .select("id, slug, name, description, is_builtin, permissions")
    .eq("school_id", schoolId)
    .order("created_at");

  if (existing && existing.length > 0) {
    return (existing as RoleTemplateRow[]).map(mapRow);
  }

  const seedRows = BUILTIN_META.map((m) => ({
    school_id: schoolId,
    slug: m.slug,
    name: m.name,
    description: m.description,
    is_builtin: true,
    permissions: BUILTIN_DEFAULTS[m.slug],
  }));

  const { data: seeded } = await supabaseAdmin
    .from("role_templates")
    .insert(seedRows)
    .select("id, slug, name, description, is_builtin, permissions");

  return ((seeded ?? []) as RoleTemplateRow[]).map(mapRow);
}
