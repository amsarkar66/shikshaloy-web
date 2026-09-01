import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { getAdmissionApplication } from "../../_lib/get-application";
import { EditAdmissionForm } from "../../_components/EditAdmissionForm";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins, institution owners, and front-desk staff can edit admissions.</p>
      </div>
    </div>
  );
}

export default async function EditAdmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["receptionist"]);
  } catch {
    return <Unauthorized />;
  }

  const result = await getAdmissionApplication(id);
  if (!result) notFound();

  return <EditAdmissionForm app={result.app} />;
}
