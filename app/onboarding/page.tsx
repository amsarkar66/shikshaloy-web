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

  const { data: existingSchool } = await supabaseAdmin
    .from("schools")
    .select(
      "id, status, name, institution_type, board, established_year, city, state, country, address, pin_code, student_range, staff_range, grades_from, grades_to, tagline, phone, email, website, udise_code"
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only a rejected application can come back through onboarding to fix
  // and resubmit — pending/active institutions have nothing to redo here.
  if (existingSchool && existingSchool.status !== "rejected") redirect("/dashboard");

  const initialData = existingSchool
    ? {
        name: existingSchool.name ?? "",
        institutionType: existingSchool.institution_type ?? "",
        board: existingSchool.board ?? "",
        establishedYear: existingSchool.established_year ? String(existingSchool.established_year) : "",
        city: existingSchool.city ?? "",
        state: existingSchool.state ?? "",
        country: existingSchool.country ?? "India",
        address: existingSchool.address ?? "",
        pinCode: existingSchool.pin_code ?? "",
        studentRange: existingSchool.student_range ?? "",
        staffRange: existingSchool.staff_range ?? "",
        gradesFrom: existingSchool.grades_from ?? "",
        gradesTo: existingSchool.grades_to ?? "",
        tagline: existingSchool.tagline ?? "",
        phone: existingSchool.phone ?? "",
        email: existingSchool.email ?? "",
        website: existingSchool.website ?? "",
        udiseCode: existingSchool.udise_code ?? "",
      }
    : undefined;

  const userName = (user.user_metadata?.full_name as string) || user.email || "";

  return (
    <InstitutionForm
      onSubmit={submitOnboarding}
      initialData={initialData}
      isResubmit={!!existingSchool}
      confirmedPhone={user.phone_confirmed_at ? (user.phone ?? null) : null}
      userName={userName}
      userEmail={user.email ?? ""}
    />
  );
}
