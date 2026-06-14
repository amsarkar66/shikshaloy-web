import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KernalView } from "./_views/kernal-view";
import { RoleView } from "./_views/role-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;

  if (role === "kernal") return <KernalView />;
  return <RoleView user={user} />;
}
