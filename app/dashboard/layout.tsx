import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId } from "@/lib/supabase/school-context";
import { DashboardShell } from "./_components/dashboard-shell";
import { PendingReviewScreen } from "./_components/pending-review-screen";
import { RejectedScreen } from "./_components/rejected-screen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "";

  // Super admin owns an institution (which can in turn own many
  // schools/colleges) — show the institution name and, when it has more
  // than one school, a switcher to pick which one is "active".
  // Everyone else (admin/staff/teacher/parent/student/driver) belongs to one school.
  let orgName: string | null = null;
  let orgLogoUrl: string | null = null;
  let schools: { id: string; name: string }[] | undefined;
  let activeSchoolId: string | null | undefined;

  if (role === "super_admin") {
    const { data: institution } = await supabaseAdmin
      .from("institutions")
      .select("id, name, logo_url, status")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!institution) redirect("/onboarding");
    if (institution.status === "pending") return <PendingReviewScreen schoolName={institution.name} />;
    if (institution.status === "rejected") return <RejectedScreen schoolName={institution.name} />;

    orgName = institution.name;
    orgLogoUrl = institution.logo_url;

    const { data: institutionSchools } = await supabaseAdmin
      .from("schools")
      .select("id, name")
      .eq("institution_id", institution.id)
      .order("created_at", { ascending: true });
    schools = institutionSchools ?? [];
    activeSchoolId = await getCurrentSchoolId();
  } else if (role !== "kernel") {
    const schoolId = await getCurrentSchoolId();
    if (schoolId) {
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("name, logo_url")
        .eq("id", schoolId)
        .maybeSingle();
      orgName = school?.name ?? null;
      orgLogoUrl = school?.logo_url ?? null;
    }
  }

  return (
    <DashboardShell
      role={role}
      user={user}
      orgName={orgName}
      orgLogoUrl={orgLogoUrl}
      schools={schools}
      activeSchoolId={activeSchoolId}
    >
      {children}
    </DashboardShell>
  );
}
