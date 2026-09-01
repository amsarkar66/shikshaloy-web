import Link from "next/link";
import { Sparkles, ShieldAlert } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getSchoolCapacity } from "@/lib/billing/plan-limits";
import AddSchoolFormClient from "./_components/AddSchoolFormClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only institution owners can add schools.</p>
      </div>
    </div>
  );
}

export default async function AddSchoolPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser || verifiedUser.role !== "super_admin") return <Unauthorized />;

  const institutionId = await getCurrentInstitutionIdOrThrow();
  const { maxSchools, atCapacity } = await getSchoolCapacity(institutionId);

  if (atCapacity) {
    return (
      <div className="w-full max-w-sm mx-auto px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-base font-bold text-gray-900 dark:text-zinc-50">You&rsquo;ve reached your plan limit</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400">
          Your current plan supports up to {maxSchools} school{maxSchools === 1 ? "" : "s"}. Upgrade for a higher limit, or contact sales for unlimited schools.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <FancyButton href="/dashboard/billing" size="sm" className="w-full justify-center">
            Upgrade plan
          </FancyButton>
          <Link
            href="/dashboard/help"
            className="flex h-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            Contact sales for unlimited
          </Link>
        </div>
      </div>
    );
  }

  return <AddSchoolFormClient />;
}
