import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import PrincipalsClient, { type Principal } from "./_components/PrincipalsClient";

export default async function PrincipalsPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");
  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const schools = await getInstitutionSchools(institutionId);
  const schoolIds = schools.map((s) => s.id);
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

  // Two ways to be an admin: profiles.role = 'admin' (invitePrincipal), or a
  // staff_members permission_template_id = 'admin' grant on a
  // teacher/staff profile whose role was deliberately left alone
  // (promoteExistingToAdmin) — see docs/architecture/role-and-identity-model.md
  // §7-8. Merge both so a promoted teacher still shows up here as an admin.
  type ProfileRow = { id: string; full_name: string | null; phone: string | null; status: string | null; school_id: string | null; created_at: string };
  let profileRows: ProfileRow[] = [];
  if (schoolIds.length) {
    const [{ data: roleAdmins }, { data: grantedStaff }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, status, school_id, created_at")
        .in("school_id", schoolIds)
        .eq("role", "admin"),
      supabaseAdmin
        .from("staff_members")
        .select("profile_id")
        .in("school_id", schoolIds)
        .eq("permission_template_id", "admin")
        .not("profile_id", "is", null),
    ]);

    profileRows = roleAdmins ?? [];
    const existingIds = new Set(profileRows.map((p) => p.id));
    const missingIds = (grantedStaff ?? [])
      .map((s) => s.profile_id as string)
      .filter((id) => id && !existingIds.has(id));

    if (missingIds.length) {
      const { data: extraProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, status, school_id, created_at")
        .in("id", missingIds);
      profileRows = [...profileRows, ...(extraProfiles ?? [])];
    }

    profileRows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const principals: Principal[] = await Promise.all(
    (profileRows ?? []).map(async (p) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(p.id);
      return {
        id: p.id,
        name: p.full_name ?? "—",
        email: authUser?.user?.email ?? "—",
        phone: p.phone ?? "—",
        schoolId: p.school_id ?? "",
        schoolName: p.school_id ? (schoolNameById.get(p.school_id) ?? "—") : "—",
        status: (p.status ?? "active") as Principal["status"],
        joinedDate: p.created_at,
      };
    })
  );

  return <PrincipalsClient principals={principals} schools={schools} />;
}
