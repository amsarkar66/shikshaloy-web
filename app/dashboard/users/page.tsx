import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { listAllUsers } from "@/lib/supabase/admin";
import UsersClient from "./_components/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const vu = await getVerifiedUser();
  if (!vu) redirect("/login");

  const role = vu.role;
  if (role !== "kernel") redirect("/dashboard");

  const users = await listAllUsers();

  return <UsersClient users={users} />;
}
