import { cache } from "react";
import { cookies } from "next/headers";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionId } from "@/lib/supabase/institution-context";

export const ACTIVE_SCHOOL_COOKIE = "active_school_id";

// Resolves the school the current signed-in user operates within:
//   - super_admin: a school within the institution they own. The owner can
//     switch between schools (see school-switcher.tsx) — the choice is
//     stored in the `active_school_id` cookie; falls back to the oldest
//     school in the institution if unset/invalid.
//   - admin / staff / teacher / parent / student / driver: profiles.school_id,
//     assigned when their account was created.
//   - kernel: platform-level role, not tied to any single school.
export const getCurrentSchoolId = cache(async (): Promise<string | null> => {
  const vu = await getVerifiedUser();
  if (!vu) return null;
  if (vu.role === "kernel") return null;

  if (vu.role === "super_admin") {
    const institutionId = await getCurrentInstitutionId();
    if (!institutionId) return null;

    const cookieStore = await cookies();
    const activeSchoolId = cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value;
    if (activeSchoolId) {
      const { data: active } = await supabaseAdmin
        .from("schools")
        .select("id")
        .eq("id", activeSchoolId)
        .eq("institution_id", institutionId)
        .maybeSingle();
      if (active) return active.id;
    }

    const { data } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }

  return vu.schoolId;
});

// Same resolution, but throws instead of returning null — for server
// actions and pages that can't render/operate without a school and would
// rather fail loudly than silently touch the wrong (or no) data.
export async function getCurrentSchoolIdOrThrow(): Promise<string> {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("No school is associated with the current account.");
  return schoolId;
}
