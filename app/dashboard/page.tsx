import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KernelView } from "./_views/kernel-view";
import { SuperAdminView } from "./_views/super-admin-view";
import { AdminView } from "./_views/admin-view";
import { RoleView } from "./_views/role-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;

  if (role === "kernel")      return <KernelView />;
  if (role === "super_admin") return <SuperAdminView user={user} />;
  if (role === "admin")       return <AdminView user={user} />;
  return <RoleView user={user} />;
}
