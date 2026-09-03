import { cache } from "react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";

// Resolves the institution the current signed-in user belongs to:
//   - super_admin: the institution they own (institutions.owner_id = user.id).
//     An owner has exactly one institution, which can in turn own many
//     schools/colleges.
//   - admin / staff / teacher / parent / student / driver: resolved via
//     their assigned school (profiles.school_id -> schools.institution_id).
//   - kernel: platform-level role, not tied to any single institution.
export const getCurrentInstitutionId = cache(async (): Promise<string | null> => {
  const vu = await getVerifiedUser();
  if (!vu) return null;
  if (vu.role === "kernel") return null;

  if (vu.role === "super_admin") {
    const { data } = await supabaseAdmin
      .from("institutions")
      .select("id")
      .eq("owner_id", vu.id)
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }

  if (!vu.schoolId) return null;

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("institution_id")
    .eq("id", vu.schoolId)
    .maybeSingle();
  return school?.institution_id ?? null;
});

// Same resolution, but throws instead of returning null — for server
// actions and pages that can't render/operate without an institution and
// would rather fail loudly than silently touch the wrong (or no) data.
export async function getCurrentInstitutionIdOrThrow(): Promise<string> {
  const institutionId = await getCurrentInstitutionId();
  if (!institutionId) throw new Error("No institution is associated with the current account.");
  return institutionId;
}

export interface InstitutionSchool {
  id: string;
  name: string;
}

// All schools under an institution, for super_admin pages that combine data
// across schools instead of scoping to a single active school (see
// lib/supabase/school-context.ts). Cached per-request like the ids above.
export const getInstitutionSchools = cache(async (institutionId: string): Promise<InstitutionSchool[]> => {
  const { data } = await supabaseAdmin
    .from("schools")
    .select("id, name")
    .eq("institution_id", institutionId)
    .order("name");
  return (data ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
});
