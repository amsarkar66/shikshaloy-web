import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
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

interface ItemRow {
  id: string; name: string | null; category: string | null; location: string | null;
  total_qty: number | null; in_use_qty: number | null; damaged_qty: number | null;
  condition: string | null; unit_cost: number | null; last_updated: string;
  school_id: string;
}

function toItem(i: ItemRow, schoolNameById?: Map<string, string>): InventoryItem {
  return {
    id: i.id,
    name: i.name ?? "",
    category: i.category ?? "Uncategorized",
    location: i.location ?? "—",
    totalQty: i.total_qty ?? 0,
    inUse: i.in_use_qty ?? 0,
    damaged: i.damaged_qty ?? 0,
    condition: (i.condition ?? "good") as InventoryItem["condition"],
    unitCost: Number(i.unit_cost ?? 0),
    lastUpdated: i.last_updated,
    schoolId: schoolNameById ? i.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(i.school_id) ?? "—") : undefined,
  };
}

const ITEM_SELECT = "id, name, category, location, total_qty, in_use_qty, damaged_qty, condition, unit_cost, last_updated, school_id";

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

    const items: InventoryItem[] = ((itemRows ?? []) as ItemRow[]).map((i) => toItem(i, schoolNameById));

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
