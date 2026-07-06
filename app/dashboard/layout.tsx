import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import { Sidebar } from "./_components/sidebar";
import { DashboardHeader } from "./_components/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "";

  // Super admin owns an institution (multiple schools) — show the institution name.
  // Everyone else (admin/staff/teacher/parent/student/driver) belongs to one school.
  let orgName: string | null = null;
  if (role === "super_admin") {
    orgName = (user.user_metadata?.institution_name as string) ?? null;
  } else if (role !== "kernel") {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("name")
      .eq("id", DEMO_SCHOOL_ID)
      .maybeSingle();
    orgName = school?.name ?? null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-50">
      <Sidebar role={role} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader role={role} user={user} orgName={orgName} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
