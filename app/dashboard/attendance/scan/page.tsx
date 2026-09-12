import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, isAdmin } from "@/lib/auth/verified-role";
import ScanClient from "../_components/ScanClient";

export default async function AttendanceScanPage() {
  const vu = await getVerifiedUser();
  const role = vu?.role;

  if (role !== "admin" && role !== "super_admin" && role !== "teacher" && !(await isAdmin(vu))) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and teachers can record attendance.</p>
        </div>
      </div>
    );
  }

  return <ScanClient />;
}
