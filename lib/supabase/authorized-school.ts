import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedUser } from "@/lib/auth/verified-role";

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

  if (vu.role === "super_admin") {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("institution_id")
      .eq("id", record.school_id)
      .maybeSingle();
    if (!school) throw new Error("Record not found");

    const { data: institution } = await supabaseAdmin
      .from("institutions")
      .select("id")
      .eq("id", school.institution_id)
      .eq("owner_id", vu.id)
      .maybeSingle();
    if (!institution) throw new Error("Unauthorized");

    return record.school_id as string;
  }

  if (vu.schoolId !== record.school_id) throw new Error("Unauthorized");
  return record.school_id as string;
}
