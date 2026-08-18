import Link from "next/link";
import { Sparkles } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getSchoolCapacity } from "@/lib/billing/plan-limits";
import AddSchoolFormClient from "./_components/AddSchoolFormClient";

export default async function AddSchoolPage() {
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
