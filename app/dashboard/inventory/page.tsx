import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import InventoryClient from "./_components/InventoryClient";
import type { InventoryItem } from "./_data/inventory";

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

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: itemRows } = await supabaseAdmin
    .from("inventory_items")
    .select("id, name, category, location, total_qty, in_use_qty, damaged_qty, condition, unit_cost, last_updated")
    .eq("school_id", schoolId)
    .order("name");

  const items: InventoryItem[] = (itemRows ?? []).map((i) => ({
    id: i.id,
    name: i.name ?? "",
    category: i.category ?? "Uncategorized",
    location: i.location ?? "—",
    totalQty: i.total_qty ?? 0,
    inUse: i.in_use_qty ?? 0,
    damaged: i.damaged_qty ?? 0,
    condition: i.condition ?? "good",
    unitCost: Number(i.unit_cost ?? 0),
    lastUpdated: i.last_updated,
  }));

  return <InventoryClient items={items} />;
}
