import { notFound, redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { EditSchoolForm, type EditableSchool } from "../../_components/edit-school-form";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");

  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: row } = await supabaseAdmin
    .from("schools")
    .select("id, name, institution_type, established_year, status, address, city, state, country, phone, website, logo_url, principal_name, principal_email, institution_id")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.institution_id !== institutionId) notFound();

  const school: EditableSchool = {
    id: row.id,
    name: row.name ?? "",
    institutionType: row.institution_type ?? "",
    establishedYear: row.established_year,
    status: (row.status as EditableSchool["status"]) ?? "active",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    country: row.country ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    logoUrl: row.logo_url,
    principalName: row.principal_name ?? "",
    principalEmail: row.principal_email ?? "",
  };

  return <EditSchoolForm school={school} />;
}
