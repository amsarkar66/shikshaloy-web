import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { InstitutionForm } from "./_institution-form";
import { submitOnboarding } from "./actions";

export default async function OnboardingPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "super_admin") redirect("/dashboard");

  const { data: existingInstitution } = await supabaseAdmin
    .from("institutions")
    .select("id, status, name, type, city, state, country, address, phone, email, website")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only a rejected application can come back through onboarding to fix
  // and resubmit — pending/active institutions have nothing to redo here.
  if (existingInstitution && existingInstitution.status !== "rejected") redirect("/dashboard");

  const existingSchool = existingInstitution
    ? (
        await supabaseAdmin
          .from("schools")
          .select("board, established_year, pin_code, student_range, staff_range, grades_from, grades_to, tagline, udise_code")
          .eq("institution_id", existingInstitution.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      ).data
    : null;

  const initialData = existingInstitution
    ? {
        name: existingInstitution.name ?? "",
        institutionType: existingInstitution.type ?? "",
        board: existingSchool?.board ?? "",
        establishedYear: existingSchool?.established_year ? String(existingSchool.established_year) : "",
        city: existingInstitution.city ?? "",
        state: existingInstitution.state ?? "",
        country: existingInstitution.country ?? "India",
        address: existingInstitution.address ?? "",
        pinCode: existingSchool?.pin_code ?? "",
        studentRange: existingSchool?.student_range ?? "",
        staffRange: existingSchool?.staff_range ?? "",
        gradesFrom: existingSchool?.grades_from ?? "",
        gradesTo: existingSchool?.grades_to ?? "",
        tagline: existingSchool?.tagline ?? "",
        phone: existingInstitution.phone ?? "",
        email: existingInstitution.email ?? "",
        website: existingInstitution.website ?? "",
        udiseCode: existingSchool?.udise_code ?? "",
      }
    : undefined;

  const userName = (user.user_metadata?.full_name as string) || user.email || "";

  return (
    <InstitutionForm
      onSubmit={submitOnboarding}
      initialData={initialData}
      isResubmit={!!existingInstitution}
      userName={userName}
      userEmail={user.email ?? ""}
    />
  );
}
