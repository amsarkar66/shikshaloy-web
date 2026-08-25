import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { listAllUsers } from "@/lib/supabase/admin";
import UsersClient from "./_components/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const users = await listAllUsers();

  return <UsersClient users={users} />;
}
