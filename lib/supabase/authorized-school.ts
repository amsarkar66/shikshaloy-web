import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedUser, type VerifiedProfile } from "@/lib/auth/verified-role";

// Verifies a school belongs to the caller — any school at all for the
// platform-level "kernel" role (not tied to any institution), any school
// within the institution a super_admin owns, or exactly the caller's own
// assigned school otherwise. Shared by resolveAuthorizedSchoolId (below) and
// by actions that create a new record and so only have a target schoolId to
// check, not an existing record to resolve one from (e.g. inviting staff
// into a school chosen from the institution-wide /dashboard/people page).
export async function assertAuthorizedSchool(vu: VerifiedProfile, schoolId: string): Promise<void> {
  if (vu.role === "kernel") return;

  if (vu.role === "super_admin") {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("institution_id")
      .eq("id", schoolId)
      .maybeSingle();
    if (!school) throw new Error("School not found");

    const { data: institution } = await supabaseAdmin
      .from("institutions")
      .select("id")
      .eq("id", school.institution_id)
      .eq("owner_id", vu.id)
      .maybeSingle();
    if (!institution) throw new Error("Unauthorized");
    return;
  }

  if (vu.schoolId !== schoolId) throw new Error("Unauthorized");
}

// Resolves the school a record (student/staff member/parent/etc.) actually
// belongs to, and verifies the current caller is allowed to manage records
// in that school — instead of trusting the "active school" cookie
// (school-context.ts), which only reflects whichever school a super_admin
// last switched to and has nothing to do with where the record being edited
// lives. This is what lets institution-wide views (e.g. /dashboard/people)
// safely edit a record in any of a super_admin's schools without first
// switching the active school to match.
//   - super_admin: any school within the institution they own.
//   - admin / staff / teacher: only their own assigned school.
// Throws if the record doesn't exist or the caller isn't authorized for it.
export async function resolveAuthorizedSchoolId(table: string, recordId: string): Promise<string> {
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");

  const { data: record } = await supabaseAdmin
    .from(table)
    .select("school_id")
    .eq("id", recordId)
    .maybeSingle();
  if (!record?.school_id) throw new Error("Record not found");

  await assertAuthorizedSchool(vu, record.school_id as string);
  return record.school_id as string;
}
