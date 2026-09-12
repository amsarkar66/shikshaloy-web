import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId } from "@/lib/supabase/school-context";
import { getVerifiedUser, isAdmin } from "@/lib/auth/verified-role";
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

  const vu = await getVerifiedUser();
  // The nav sidebar and dashboard/page.tsx's view routing must agree on
  // "effective role," or a promoted teacher (profiles.role left as
  // 'teacher' — see docs/architecture/role-and-identity-model.md §7-8)
  // would land on AdminView with the Teacher sidebar and no way to reach
  // any admin screen. isAdmin() is a no-op for everyone whose role was
  // already 'admin', so this changes nothing for existing admins.
  const baseRole = vu?.role ?? "";
  const role = baseRole !== "admin" && (await isAdmin(vu)) ? "admin" : baseRole;

  // Super admin owns an institution (which can in turn own many
  // schools/colleges) — show the institution name. Each dashboard page that
  // needs a specific school (see lib/supabase/school-context.ts's
  // getSchoolPickerData and app/dashboard/_components/page-school-picker.tsx)
  // renders its own in-page picker instead of a sidebar-level one.
  // Everyone else (admin/staff/teacher/parent/student/driver) belongs to one school.
  let orgName: string | null = null;
  let orgLogoUrl: string | null = null;

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
    >
      {children}
    </DashboardShell>
  );
}
