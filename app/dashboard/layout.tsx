import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-50">
      <Sidebar role={role} user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader role={role} user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
