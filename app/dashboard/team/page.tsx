import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { listKernelUsers } from "@/lib/supabase/admin";
import { KERNEL_PERMISSIONS, type KernelPermission } from "@/lib/kernel-permissions";
import TeamClient from "./_components/TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const members = await listKernelUsers();

  const rawPermission = user.user_metadata?.kernel_permission as string | undefined;
  const currentPermission: KernelPermission = (KERNEL_PERMISSIONS as readonly string[]).includes(rawPermission ?? "")
    ? (rawPermission as KernelPermission)
    : "owner";

  return <TeamClient members={members} currentUserId={user.id} currentPermission={currentPermission} />;
}
