import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { listKernelUsers } from "@/lib/supabase/admin";
import type { KernelPermission } from "@/lib/kernel-permissions";
import TeamClient from "./_components/TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");
  if (verifiedUser.role !== "kernel") redirect("/dashboard");

  const members = await listKernelUsers();

  const currentPermission: KernelPermission = verifiedUser.kernelPermission ?? "owner";

  return <TeamClient members={members} currentUserId={verifiedUser.id} currentPermission={currentPermission} />;
}
