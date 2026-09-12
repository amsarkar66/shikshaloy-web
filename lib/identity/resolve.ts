import { supabaseAdmin } from "@/lib/supabase/service";
import type { VerifiedProfile } from "@/lib/auth/verified-role";

export interface DashboardIdentity {
  key: string;
  label: string;
}

const BASE_ROLE_LABEL: Record<string, string> = {
  kernel: "Product Owner",
  super_admin: "Institution Owner",
  admin: "Admin",
  staff: "Staff",
  teacher: "Teacher",
  student: "Student",
  driver: "Driver",
};

function rank(key: string): number {
  if (key === "admin") return 0;
  if (key === "parent") return 2;
  return 1;
}

// Enumerates every dashboard "identity" (which view + nav to show) this
// profile can act as right now, at their current school. Two kinds beyond
// the base role:
//  - an admin grant on a teacher/staff's staff_members row
//    (promoteExistingToAdmin deliberately leaves profiles.role alone — see
//    docs/architecture/role-and-identity-model.md §7-9), and
//  - a linked parents row at this school (any role can also be a parent
//    there — §2.3; the identity switcher is what finally surfaces it).
// Order matters: index 0 is the default landing identity when no cookie
// (or an invalid one) is set — admin ranks first to preserve the priority
// dashboard/page.tsx already gave it before this switcher existed.
export async function getAvailableIdentities(vu: VerifiedProfile): Promise<DashboardIdentity[]> {
  const byKey = new Map<string, DashboardIdentity>();
  byKey.set(vu.role, { key: vu.role, label: BASE_ROLE_LABEL[vu.role] ?? vu.role });

  if (vu.schoolId && (vu.role === "teacher" || vu.role === "staff")) {
    const { data: staff } = await supabaseAdmin
      .from("staff_members")
      .select("permission_template_id")
      .eq("profile_id", vu.id)
      .eq("school_id", vu.schoolId)
      .maybeSingle();
    if (staff?.permission_template_id === "admin") {
      byKey.set("admin", { key: "admin", label: "Admin" });
    }
  }

  if (vu.schoolId) {
    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("profile_id", vu.id)
      .eq("school_id", vu.schoolId)
      .maybeSingle();
    if (parent) byKey.set("parent", { key: "parent", label: "Parent" });
  }

  return [...byKey.values()].sort((a, b) => rank(a.key) - rank(b.key));
}
