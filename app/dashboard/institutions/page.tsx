import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { listInstitutions } from "@/lib/supabase/admin";
import InstitutionsClient from "./_components/InstitutionsClient";

export const dynamic = "force-dynamic";

export default async function InstitutionsPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = await getVerifiedRole();
  if (role !== "kernel") redirect("/dashboard");

  const institutions = await listInstitutions();

  return <InstitutionsClient institutions={institutions} />;
}
