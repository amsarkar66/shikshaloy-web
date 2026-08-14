import { getUser } from "@/lib/supabase/server";
import { getDriverContext } from "@/lib/drivers/context";
import RoutesClient from "./_components/RoutesClient";

export default async function RoutesPage() {
  const { data: { user } } = await getUser();

  if (!user) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Please sign in</p>
        </div>
      </div>
    );
  }

  const driver = await getDriverContext(user.id);

  if (!driver) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🚌</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have a staff record yet. Ask your school admin to link your login.
          </p>
        </div>
      </div>
    );
  }

  return <RoutesClient routes={driver.routes} />;
}
