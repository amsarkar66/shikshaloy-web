import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import InventoryClient from "./_components/InventoryClient";
import type { InventoryItem } from "./_data/inventory";

export default async function InventoryPage() {
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
