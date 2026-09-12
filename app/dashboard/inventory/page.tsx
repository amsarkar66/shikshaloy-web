import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import InventoryClient from "./_components/InventoryClient";
import { toItem, ITEM_SELECT, type InventoryItem, type ItemRow } from "./_data/inventory";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and lab staff can manage inventory.</p>
      </div>
    </div>
  );
}

export default async function InventoryPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["lab_assistant"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();

  if (verifiedUser?.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <InventoryClient items={[]} schools={schools} />;
    }

    const { data: itemRows } = await supabaseAdmin
      .from("inventory_items")
      .select(ITEM_SELECT)
      .in("school_id", schoolIds)
      .order("name");

    const items: InventoryItem[] = ((itemRows ?? []) as ItemRow[]).map((i) => toItem(i, schoolNameById.get(i.school_id) ?? "—"));

    return <InventoryClient items={items} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: itemRows } = await supabaseAdmin
    .from("inventory_items")
    .select(ITEM_SELECT)
    .eq("school_id", schoolId)
    .order("name");

  const items: InventoryItem[] = ((itemRows ?? []) as ItemRow[]).map((i) => toItem(i));

  return <InventoryClient items={items} />;
}
