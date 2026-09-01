import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import PrincipalsClient, { type Principal } from "./_components/PrincipalsClient";

export default async function PrincipalsPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");
  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name")
    .eq("institution_id", institutionId)
    .order("name");

  const schools = (schoolRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
  const schoolIds = schools.map((s) => s.id);
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

  const { data: profileRows } = schoolIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, status, school_id, created_at")
        .in("school_id", schoolIds)
        .eq("role", "admin")
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; full_name: string | null; phone: string | null; status: string | null; school_id: string | null; created_at: string }[] };

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
